import React,{useEffect,useState} from 'react';
import {Alert,Pressable,StyleSheet,Text,View} from 'react-native';
import {useRouter} from 'expo-router';
import Screen from '@/components/Screen';
import {api} from '@/services/api';
import {Listing} from '@/types';
import {theme} from '@/constants/theme';

export default function MyListings(){
  const [items,setItems]=useState<Listing[]>([]),
  [tab,setTab]=useState('active');

  const router=useRouter();

  const load=()=>api('/listings/mine')
    .then(b=>setItems(b.data.listings))
    .catch(()=>{});

  useEffect(()=>{
    load()
  },[]);

  const shown=items.filter(x=>x.status===tab);

  return (
    <Screen>
      <Text style={s.h}>My Ads</Text>

      <View style={s.tabs}>
        {['active','pending','sold','rejected','expired'].map(x=>(
          <Pressable
            key={x}
            onPress={()=>setTab(x)}
            style={[s.tab,tab===x&&s.tabActive]}
          >
            <Text style={[s.tabText,tab===x&&{color:'#fff'}]}>
              {x}
            </Text>
          </Pressable>
        ))}
      </View>

      {shown.map(x=>(
        <View key={x._id} style={s.card}>
          <View style={{flex:1}}>
            <Text style={s.title}>
              {x.title}
            </Text>

            <Text style={s.price}>
              ₹{Number(x.price).toLocaleString('en-IN')}
            </Text>

            <Text style={s.meta}>
              {x.location} · {x.status}
            </Text>
          </View>

          <View style={{gap:7}}>
            {x.status==='active'&&
              <Pressable
                onPress={()=>router.push(`/listing/${x._id}` as any)}
                style={s.small}
              >
                <Text style={s.smallText}>
                  View
                </Text>
              </Pressable>
            }

            {['active','pending','rejected'].includes(x.status)&&
              <Pressable
                onPress={()=>Alert.alert(
                  'Delete ad',
                  'This cannot be undone.',
                  [
                    {
                      text:'Cancel'
                    },
                    {
                      text:'Delete',
                      style:'destructive',
                      onPress:async()=>{
                        await api(
                          `/listings/${x._id}`,
                          {
                            method:'DELETE'
                          }
                        );
                        load()
                      }
                    }
                  ]
                )}
                style={[s.small,{borderColor:'#FECACA'}]}
              >
                <Text style={{color:theme.danger,fontWeight:'800'}}>
                  Delete
                </Text>
              </Pressable>
            }

            {x.status==='active'&&
              <Pressable
                onPress={async()=>{
                  await api(
                    `/listings/${x._id}/sold`,
                    {
                      method:'POST'
                    }
                  );
                  load()
                }}
                style={s.small}
              >
                <Text style={s.smallText}>
                  Mark sold
                </Text>
              </Pressable>
            }

            {x.status==='sold'&&
              <Pressable
                onPress={async()=>{
                  await api(
                    `/listings/${x._id}/repost`,
                    {
                      method:'POST'
                    }
                  );
                  load()
                }}
                style={s.small}
              >
                <Text style={s.smallText}>
                  Repost
                </Text>
              </Pressable>
            }
          </View>
        </View>
      ))}

      {!shown.length&&
        <Text
          style={{
            textAlign:'center',
            color:theme.muted,
            marginTop:40
          }}
        >
          No ads in this section.
        </Text>
      }
    </Screen>
  );
}

const s=StyleSheet.create({
  h:{
    fontSize:30,
    fontWeight:'900',
    color:theme.ink
  },

  tabs:{
    flexDirection:'row',
    gap:7,
    marginVertical:18
  },

  tab:{
    paddingHorizontal:12,
    paddingVertical:9,
    borderRadius:18,
    borderWidth:1,
    borderColor:theme.line,
    backgroundColor:'#fff'
  },

  tabActive:{
    backgroundColor:theme.ink,
    borderColor:theme.ink
  },

  tabText:{
    fontSize:11,
    fontWeight:'800'
  },

  card:{
    backgroundColor:'#fff',
    borderRadius:18,
    borderWidth:1,
    borderColor:theme.line,
    padding:14,
    marginBottom:10,
    flexDirection:'row'
  },

  title:{
    fontWeight:'900',
    fontSize:15,
    color:theme.ink
  },

  price:{
    fontWeight:'900',
    fontSize:19,
    marginTop:5
  },

  meta:{
    fontSize:11,
    color:theme.muted,
    marginTop:5
  },

  small:{
    borderWidth:1,
    borderColor:theme.line,
    borderRadius:10,
    paddingVertical:7,
    paddingHorizontal:9,
    alignItems:'center'
  },

  smallText:{
    fontWeight:'800',
    fontSize:11,
    color:theme.ink
  }
});