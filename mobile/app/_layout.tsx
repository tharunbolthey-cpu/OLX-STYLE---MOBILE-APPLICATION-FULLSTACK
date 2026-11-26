import React from 'react';
import {Stack,useRouter,useSegments} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import AppProvider from '@/context/AppProvider';
import {useAuth} from '@/context/AuthContext';
import {ActivityIndicator,View} from 'react-native';

function Gate(){
  const {user,loading}=useAuth();

  const segments=useSegments();

  const router=useRouter();

  React.useEffect(()=>{
    if(loading)return;

    const inAuth=segments[0]==='(auth)';

    if(!user&&!inAuth)
      router.replace('/(auth)/login');
    else if(user&&inAuth)
      router.replace('/(tabs)');
  },[user,loading,segments]);

  if(loading)
    return (
      <View style={{flex:1,alignItems:'center',justifyContent:'center'}}>
        <ActivityIndicator size="large"/>
      </View>
    );

  return (
    <Stack screenOptions={{headerShown:false}}/>
  );
}

export default function Layout(){
  return (
    <AppProvider>
      <StatusBar style="dark"/>
      <Gate/>
    </AppProvider>
  );
}