import React from 'react';
import {Pressable,Text,View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {theme} from '@/constants/theme';

export default function CategoryChip({
  name,
  icon,
  onPress
}:{
  name:string;
  icon:string;
  onPress:()=>void
}){
  return (
    <Pressable
      onPress={onPress}
      style={{
        width:84,
        alignItems:'center',
        marginRight:12
      }}
    >
      <View
        style={{
          width:62,
          height:62,
          borderRadius:31,
          backgroundColor:'#fff',
          alignItems:'center',
          justifyContent:'center',
          borderWidth:1,
          borderColor:theme.line
        }}
      >
        <Ionicons
          name={(icon as any)||'grid-outline'}
          size={25}
          color={theme.primary}
        />
      </View>

      <Text
        numberOfLines={1}
        style={{
          fontSize:11,
          fontWeight:'700',
          color:theme.ink,
          marginTop:8
        }}
      >
        {name}
      </Text>
    </Pressable>
  );
};