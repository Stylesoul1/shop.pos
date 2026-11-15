const express=require('express'),fs=require('fs'),path=require('path'),bcrypt=require('bcryptjs'),jwt=require('jsonwebtoken'),crypto=require('crypto');
const PORT=process.env.PORT||3000,DIR=process.env.DATA_DIR||path.join(__dirname,'data'),FILE=path.join(DIR,'data.json');
fs.mkdirSync(DIR,{recursive:true});
let S={users:[],shops:{},secret:''};
try{S=Object.assign(S,JSON.parse(fs.readFileSync(FILE,'utf8')))}catch(e){}
if(!S.secret)S.secret=process.env.JWT_SECRET||crypto.randomBytes(32).toString('hex');
function save(){fs.writeFileSync(FILE+'.tmp',JSON.stringify(S));fs.renameSync(FILE+'.tmp',FILE)}
const AE=(process.env.ADMIN_EMAIL||'').toLowerCase().trim(),AP=process.env.ADMIN_PASSWORD;
if(!AE||!AP){console.error('ADMIN_EMAIL aur ADMIN_PASSWORD environment variables set karein.');process.exit(1)}
let ad=S.users.find(u=>u.role==='admin');
if(!ad){ad={id:crypto.randomUUID(),name:'Admin',shop:'Admin',phone:'',role:'admin',status:'approved',created:Date.now()};S.users.push(ad)}
ad.email=AE;ad.hash=bcrypt.hashSync(AP,10);save();
const pub=u=>({id:u.id,name:u.name,shop:u.shop,email:u.email,phone:u.phone,role:u.role,status:u.status,created:u.created});
const bad=(res,c,t,x)=>res.status(c).json(Object.assign({error:t},x||{}));
const tries={};const limited=k=>{const t=Date.now(),a=(tries[k]||[]).filter(x=>t-x<9e5);tries[k]=a;return a.length>=10};
const app=express();app.set('trust proxy',1);app.use(express.json({limit:'10mb'}));
app.post('/api/signup',(req,res)=>{const b=req.body||{},email=String(b.email||'').toLowerCase().trim();
 if(!/^\S+@\S+\.\S+$/.test(email))return bad(res,400,'Sahi email likhein');
 if(String(b.password||'').length<6)return bad(res,400,'Password kam az kam 6 huroof ka rakhein');
 if(!String(b.name||'').trim()||!String(b.shop||'').trim())return bad(res,400,'Apna naam aur dukan ka naam likhein');
 if(S.users.some(u=>u.email===email))return bad(res,409,'Ye email pehle se registered hai');
 S.users.push({id:crypto.randomUUID(),name:String(b.name).trim().slice(0,80),shop:String(b.shop).trim().slice(0,80),phone:String(b.phone||'').slice(0,30),email,hash:bcrypt.hashSync(String(b.password),10),role:'owner',status:'pending',created:Date.now()});save();
 res.json({message:'Aap ki request bhej di gayi hai. Admin ke approve karne ke baad aap login kar sakenge.'})});
app.post('/api/login',(req,res)=>{const b=req.body||{},email=String(b.email||'').toLowerCase().trim(),k=req.ip+email;
 if(limited(k))return bad(res,429,'Bohat zyada koshishein. 15 minute baad dobara try karein');
 const u=S.users.find(x=>x.email===email);
 if(!u||!bcrypt.compareSync(String(b.password||''),u.hash)){(tries[k]=tries[k]||[]).push(Date.now());return bad(res,401,'Email ya password ghalat hai')}
 const m={pending:'Aap ki request abhi manzoor nahi hui. Admin ke approve karne ka intizar karein.',rejected:'Aap ki request manzoor nahi hui.',blocked:'Aap ka account band kar diya gaya hai.'};
 if(u.status!=='approved')return bad(res,403,m[u.status]||'Account active nahi hai');
 res.json({token:jwt.sign({id:u.id},S.secret,{expiresIn:'30d'}),user:pub(u)})});
function auth(req,res,next){try{const t=(req.headers.authorization||'').replace('Bearer ','');const p=jwt.verify(t,S.secret),u=S.users.find(x=>x.id===p.id);
 if(!u)return bad(res,401,'Dobara login karein');if(u.status!=='approved')return bad(res,403,'Account active nahi hai');req.u=u;next()}catch(e){bad(res,401,'Dobara login karein')}}
const admin=(req,res,next)=>req.u.role==='admin'?next():bad(res,403,'Sirf admin ke liye');
app.get('/api/data',auth,(req,res)=>res.json({data:S.shops[req.u.id]||null}));
app.put('/api/data',auth,(req,res)=>{const d=(req.body||{}).data;if(!d||!Array.isArray(d.products)||!Array.isArray(d.orders))return bad(res,400,'Data sahi nahi hai');
 const c=S.shops[req.u.id];if(c&&c.updated>d.updated)return bad(res,409,'Server par naya data hai',{data:c});S.shops[req.u.id]=d;save();res.json({ok:true})});
app.get('/api/admin/users',auth,admin,(req,res)=>res.json({users:S.users.filter(u=>u.role!=='admin').map(pub).sort((a,b)=>b.created-a.created)}));
app.post('/api/admin/users/:id/status',auth,admin,(req,res)=>{const s=(req.body||{}).status,u=S.users.find(x=>x.id===req.params.id&&x.role!=='admin');
 if(!u||!['approved','rejected','blocked','pending'].includes(s))return bad(res,400,'Ghalat request');u.status=s;save();res.json({user:pub(u)})});
app.use(express.static(path.join(__dirname,'public')));
app.listen(PORT,()=>console.log('Dukan POS chal raha hai: port '+PORT));
