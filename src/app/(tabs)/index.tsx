import { useEffect, useRef, useState } from "react";
import { BackHandler, useWindowDimensions, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import PagerView, {
  type PagerViewOnPageSelectedEvent,
} from "react-native-pager-view";

import { FloatingCrosses } from "@/auth/FloatingCrosses";
import { FloatingTabBar } from "@/components/FloatingTabBar";
import { ProfileHeader } from "@/components/ProfileHeader";
import { ScreenBackground } from "@/components/ScreenBackground";
import { useRunStore } from "@/run/run-store";
import { AnalyticsScreen } from "@/screens/AnalyticsScreen";
import { HomeScreen } from "@/screens/HomeScreen";
import { RunScreen } from "@/screens/RunScreen";
import { WorkoutScreen } from "@/screens/WorkoutScreen";

// Головний екран: постійна шапка + горизонтальний пейджер з 4 вкладок.
// Свайп гортає з анімацією (рух за пальцем), тап у меню — миттєво.
export default function MainPager() {
  const pagerRef = useRef<PagerView>(null);
  const [page, setPage] = useState(0);

  // Під час активного забігу навігація заблокована: не можна піти з «Бігу».
  const running = useRunStore((s) => s.status === "running");

  // Бо PagerView на Android за апаратною кнопкою «назад» перегортає на першу
  // сторінку, а під час забігу свайп і таб-бар вимкнені — користувач застрягав
  // на «Головному» без виходу. Поки триває забіг — глушимо системний «назад».
  useEffect(() => {
    if (!running) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => sub.remove();
  }, [running]);

  // Тап у нижньому меню — без анімації зсуву (свайп лишається анімованим).
  const goTo = (i: number) => {
    if (running) return; // забіг триває — перемикання вкладок вимкнене
    setPage(i);
    pagerRef.current?.setPageWithoutAnimation(i);
  };

  const onPageSelected = (e: PagerViewOnPageSelectedEvent) => {
    setPage(e.nativeEvent.position);
  };

  const { width, height } = useWindowDimensions();

  // Під час забігу шапка профілю згортається (висота→0 + згасання), щоб «Біг»
  // розгорнувся на весь екран. Природну висоту міряємо один раз до анімації.
  const [headerH, setHeaderH] = useState(0);
  const headerP = useSharedValue(0);

  useEffect(() => {
    headerP.value = withTiming(running ? 1 : 0, {
      duration: 380,
      easing: Easing.inOut(Easing.cubic),
    });
  }, [running, headerP]);

  const headerStyle = useAnimatedStyle(() => ({
    height: headerH > 0 ? headerH * (1 - headerP.value) : undefined,
    opacity: 1 - headerP.value,
    transform: [{ translateY: -headerH * 0.3 * headerP.value }],
  }));

  return (
    <View className="flex-1 bg-bg">
      <ScreenBackground />
      {/* Хрестики як на авторизації — фонова декорація за контентом. */}
      <FloatingCrosses width={width} height={height} count={14} />
      <Animated.View
        className="overflow-hidden"
        style={headerStyle}
        onLayout={(e) => {
          if (headerH === 0) setHeaderH(e.nativeEvent.layout.height);
        }}
      >
        <ProfileHeader />
      </Animated.View>

      <View className="flex-1">
        <PagerView
          ref={pagerRef}
          style={{ flex: 1 }}
          initialPage={0}
          onPageSelected={onPageSelected}
          // Під час забігу свайп між вкладками вимкнено.
          scrollEnabled={!running}
        >
          <View key="home" className="flex-1">
            <HomeScreen onGoToRun={() => goTo(2)} />
          </View>
          <View key="workout" className="flex-1">
            <WorkoutScreen />
          </View>
          <View key="run" className="flex-1">
            <RunScreen />
          </View>
          <View key="analytics" className="flex-1">
            <AnalyticsScreen />
          </View>
        </PagerView>
      </View>

      <FloatingTabBar index={page} onChange={goTo} locked={running} />
    </View>
  );
}
