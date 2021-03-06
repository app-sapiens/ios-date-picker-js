import React, { useCallback, useRef } from "react";
import { View, StyleSheet, Text, FlatList } from "react-native";
import MaskedView from "@react-native-community/masked-view";

import { VISIBLE_ITEMS, ITEM_HEIGHT } from "./Constants";
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const AnimatedFlatList: typeof FlatList = Animated.createAnimatedComponent(
  FlatList
);
const perspective = 600;
const RADIUS_REL = VISIBLE_ITEMS * 0.5;
const RADIUS = RADIUS_REL * ITEM_HEIGHT;

interface PickerProps {
  defaultValue: number;
  values: { value: number; label: string }[];
  flex: number;
  onChange: (value: number) => void;
}

const AnimatedItem = ({ item, index, translateY }: any) => {
  const style = useAnimatedStyle(() => {
    const y = interpolate(
      translateY.value - index * ITEM_HEIGHT,
      [-ITEM_HEIGHT * 2, 0, ITEM_HEIGHT * 2],
      [-0.8, 0, 0.8],
      Extrapolate.CLAMP
    );
    const rotateX = Math.asin(y);
    const z = RADIUS * Math.cos(rotateX) - RADIUS;

    return {
      transform: [
        { perspective },
        { rotateX: rotateX + "rad" },
        { scale: perspective / (perspective - z) },
      ],
    };
  });
  return (
    <Animated.View key={item.value} style={[styles.item, style]}>
      <Text style={styles.label}>{item.label}</Text>
    </Animated.View>
  );
};

const PickerComponent = ({
  values,
  defaultValue,
  flex,
  onChange,
}: PickerProps) => {
  const ref = useRef<FlatList<string>>(null);
  const translateY = useSharedValue(0);
  const scrolled: Animated.SharedValue<boolean> = useSharedValue(false);

  const onScroll = useAnimatedScrollHandler<{ beginY?: number; endY?: number }>(
    {
      onScroll: (event) => {
        translateY.value = event.contentOffset.y;
        const value = event.contentOffset.y / ITEM_HEIGHT;
        if (!scrolled.value) return (scrolled.value = true);

        if (value % 1 === 0 && scrolled.value) {
          return onChange(value);
        }
      },
    }
  );

  const opacity = useAnimatedStyle(() => ({
    opacity: withTiming(scrolled.value ? 1 : 0, { duration: 1000 }),
  }));

  const renderItem = useCallback(
    ({ item, index }: any) => (
      <AnimatedItem
        item={item}
        index={index}
        scrolled={scrolled}
        translateY={translateY}
      />
    ),
    []
  );

  return (
    <View style={[styles.container, { flex }]}>
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.border} />
      </View>
      <MaskedView
        maskElement={
          <View style={styles.maskContainer}>
            <View style={styles.maskEdge} />
            <View style={styles.maskCenter} />
            <View style={styles.maskEdge} />
          </View>
        }
      >
        <AnimatedFlatList
          onLayout={() => {
            ref?.current?.scrollToIndex({
              index: defaultValue,
              animated: false,
            });
            if (defaultValue === 0) {
              scrolled.value = true;
            }
          }}
          ref={ref}
          getItemLayout={(_, index) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
          })}
          keyExtractor={({ label }: any) => label}
          style={opacity}
          contentContainerStyle={{
            paddingVertical: ITEM_HEIGHT * 2,
          }}
          data={values}
          renderItem={renderItem}
          snapToInterval={ITEM_HEIGHT}
          onScroll={onScroll}
        />
      </MaskedView>
    </View>
  );
};

export default PickerComponent;

const styles = StyleSheet.create({
  container: {
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    overflow: "hidden",
  },
  border: {
    borderColor: "grey",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    top: ITEM_HEIGHT * 2,
    height: ITEM_HEIGHT,
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: "center",
  },
  label: {
    color: "white",
    fontSize: 24,
    lineHeight: ITEM_HEIGHT,
    textAlign: "center",
    textAlignVertical: "center",
  },
  maskContainer: {
    height: ITEM_HEIGHT * 5,
  },
  maskCenter: {
    flex: 1,
    backgroundColor: "white",
  },
  maskEdge: {
    flex: 2,
    backgroundColor: "white",
    opacity: 0.5,
  },
});
