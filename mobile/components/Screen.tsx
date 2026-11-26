import React from 'react';
import {
  RefreshControl,
  ScrollView,
  View,
  ViewStyle
} from 'react-native';
import {theme} from '@/constants/theme';

export default function Screen({
  children,
  refreshing,
  onRefresh,
  contentStyle
}:{
  children:React.ReactNode;
  refreshing?:boolean;
  onRefresh?:()=>void;
  contentStyle?:ViewStyle;
}){
  return (
    <ScrollView
      style={{
        flex:1,
        backgroundColor:theme.bg
      }}
      contentContainerStyle={[
        {
          padding:18,
          paddingBottom:110
        },
        contentStyle
      ]}
      refreshControl={
        onRefresh?
          <RefreshControl
            refreshing={!!refreshing}
            onRefresh={onRefresh}
          />
          :
          undefined
      }
    >
      {children}
    </ScrollView>
  );
}