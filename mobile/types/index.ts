export type User = {
  id:string;
  _id?:string;
  name:string;
  email:string;
  phone?:string;
  location?:string;
  avatar?:string;
  role:'user'|'admin';
  createdAt?:string;
};

export type Category = {
  _id:string;
  name:string;
  icon:string;
  subcategories:string[];
};

export type Listing = {
  _id:string;
  title:string;
  description:string;
  price:number;
  category:{
    _id:string;
    name:string;
    icon?:string;
  }|string;
  subcategory?:string;
  images:string[];
  condition:string;
  location:string;
  seller:{
    _id:string;
    name:string;
    avatar?:string;
    location?:string;
    createdAt?:string;
  };
  status:string;
  views:number;
  featured?:boolean;
  createdAt:string;
};

export type Conversation = {
  _id:string;
  buyer:User;
  seller:User;
  listing:Listing;
  lastMessage:string;
  updatedAt:string;
};

export type Message = {
  _id:string;
  conversation:string;
  sender:User;
  text:string;
  read:boolean;
  createdAt:string;
};