import React,{useState} from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

import {
  useRouter
} from 'expo-router';

import Screen from '@/components/Screen';

import {api} from '@/services/api';

import {useAuth} from '@/context/AuthContext';

import {theme} from '@/constants/theme';

export default function Settings(){
  const {user,refresh}=useAuth();

  const router=useRouter();

  const [v,setV]=useState({
    name:user?.name||'',
    phone:user?.phone||'',
    location:user?.location||''
  });

  const save=async()=>{
    try{
      await api(
        '/users/profile',
        {
          method:'PUT',
          body:JSON.stringify(v)
        }
      );

      await refresh();

      Alert.alert(
        'Saved',
        'Profile updated.',
        [
          {
            text:'OK',
            onPress:()=>{
              router.back();
            }
          }
        ]
      );
    }catch(e:any){
      Alert.alert(
        'Error',
        e.message
      );
    }
  };

  return (
    <Screen>
      <Text style={s.h}>
        Settings
      </Text>

      <View style={s.card}>
        <Text style={s.label}>
          Name
        </Text>

        <TextInput
          value={v.name}
          onChangeText={x=>setV({...v,name:x})}
          style={s.input}
        />

        <Text style={s.label}>
          Phone
        </Text>

        <TextInput
          value={v.phone}
          onChangeText={x=>setV({...v,phone:x})}
          style={s.input}
        />

        <Text style={s.label}>
          Location
        </Text>

        <TextInput
          value={v.location}
          onChangeText={x=>setV({...v,location:x})}
          style={s.input}
        />

        <Pressable
          onPress={save}
          style={s.btn}
        >
          <Text style={{color:'#fff',fontWeight:'900'}}>
            Save changes
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const s=StyleSheet.create({
  h:{
    fontSize:30,
    fontWeight:'900',
    color:theme.ink,
    marginBottom:18
  },

  card:{
    backgroundColor:'#fff',
    borderRadius:20,
    borderWidth:1,
    borderColor:theme.line,
    padding:18
  },

  label:{
    fontWeight:'800',
    fontSize:12,
    marginBottom:7
  },

  input:{
    height:52,
    borderWidth:1,
    borderColor:theme.line,
    borderRadius:13,
    paddingHorizontal:13,
    marginBottom:15
  },

  btn:{
    height:52,
    borderRadius:14,
    backgroundColor:theme.primary,
    alignItems:'center',
    justifyContent:'center'
  }
});