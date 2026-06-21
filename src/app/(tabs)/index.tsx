import { useRef, useState } from "react";
import { useWindowDimensions, View } from "react-native";
import PagerView, {
  type PagerViewOnPageSelectedEvent,
} from "react-native-pager-view";

import { FloatingCrosses } from "@/auth/FloatingCrosses";
import { FloatingTabBar } from "@/components/FloatingTabBar";
import { ProfileHeader } from "@/components/ProfileHeader";
import { ScreenBackground } from "@/components/ScreenBackground";
import { AnalyticsScreen } from "@/screens/AnalyticsScreen";
import { HomeScreen } from "@/screens/HomeScreen";
import { RunScreen } from "@/screens/RunScreen";
import { WorkoutScreen } from "@/screens/WorkoutScreen";

// Головний екран: постійна шапка + горизонтальний пейджер з 4 вкладок.
// Свайп гортає з анімацією (рух за пальцем), тап у меню — миттєво.
export default function MainPager() {
  const pagerRef = useRef<PagerView>(null);
  const [page, setPage] = useState(0);

  // Тап у нижньому меню — без анімації зсуву (свайп лишається анімованим).
  const goTo = (i: number) => {
    setPage(i);
    pagerRef.current?.setPageWithoutAnimation(i);
  };

  const onPageSelected = (e: PagerViewOnPageSelectedEvent) => {
    setPage(e.nativeEvent.position);
  };

  const { width, height } = useWindowDimensions();

  return (
    <View className="flex-1 bg-bg">
      <ScreenBackground />
      {/* Хрестики як на авторизації — фонова декорація за контентом. */}
      <FloatingCrosses width={width} height={height} count={14} />
      <ProfileHeader />

      <View className="flex-1">
        <PagerView
          ref={pagerRef}
          style={{ flex: 1 }}
          initialPage={0}
          onPageSelected={onPageSelected}
        >
          <View key="home" className="flex-1">
            <HomeScreen />
          </View>
          <View key="workout" className="flex-1">
            <WorkoutScreen />
          </View>
          <View key="analytics" className="flex-1">
            <AnalyticsScreen />
          </View>
          <View key="run" className="flex-1">
            <RunScreen />
          </View>
        </PagerView>
      </View>

      <FloatingTabBar index={page} onChange={goTo} />
    </View>
  );
}
