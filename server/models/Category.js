const mongoose=require('mongoose');
const schema=new mongoose.Schema({name:{type:String,required:true,unique:true,trim:true},icon:{type:String,default:'tag'},subcategories:[{type:String}],active:{type:Boolean,default:true}},{timestamps:true});
module.exports=mongoose.model('Category',schema);
