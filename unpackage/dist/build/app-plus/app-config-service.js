
var isReady=false;var onReadyCallbacks=[];
var __uniConfig = {"pages":["pages/login/index","pages/list/index","pages/user/index","pages/list/record","pages/list/relic","pages/list/wait","pages/list/store","pages/details/index","pages/details/record","pages/details/edit","pages/details/imageDelete","pages/list/user","pages/operate/index","pages/list/permission","pages/list/role","pages/details/assignPermission","pages/forgetPassword/forgetPassword"],"window":{"navigationBarTextStyle":"black","navigationStyle":"custom","navigationBarBackgroundColor":"#FFFFFF","backgroundColor":"#FFFFFF"},"tabBar":{"selectedColor":"#5677fc","list":[{"text":"首页","pagePath":"pages/list/index","iconPath":"static/image/tabbar/shouye-xianxing.png","selectedIconPath":"static/image/tabbar/shouye.png"},{"text":"我的","pagePath":"pages/user/index","iconPath":"static/image/tabbar/yonghu-xianxing.png","selectedIconPath":"static/image/tabbar/yonghu.png"}]},"nvueCompiler":"uni-app","renderer":"auto","splashscreen":{"alwaysShowBeforeRender":true,"autoclose":false},"appname":"故宫博物馆后台管理系统","compilerVersion":"2.7.9","entryPagePath":"pages/login/index","networkTimeout":{"request":60000,"connectSocket":60000,"uploadFile":60000,"downloadFile":60000}};
var __uniRoutes = [{"path":"/pages/login/index","meta":{"isQuit":true},"window":{}},{"path":"/pages/list/index","meta":{"isQuit":true,"isTabBar":true},"window":{}},{"path":"/pages/user/index","meta":{"isQuit":true,"isTabBar":true},"window":{}},{"path":"/pages/list/record","meta":{},"window":{}},{"path":"/pages/list/relic","meta":{},"window":{}},{"path":"/pages/list/wait","meta":{},"window":{}},{"path":"/pages/list/store","meta":{},"window":{}},{"path":"/pages/details/index","meta":{},"window":{}},{"path":"/pages/details/record","meta":{},"window":{}},{"path":"/pages/details/edit","meta":{},"window":{}},{"path":"/pages/details/imageDelete","meta":{},"window":{}},{"path":"/pages/list/user","meta":{},"window":{}},{"path":"/pages/operate/index","meta":{},"window":{}},{"path":"/pages/list/permission","meta":{},"window":{}},{"path":"/pages/list/role","meta":{},"window":{}},{"path":"/pages/details/assignPermission","meta":{},"window":{}},{"path":"/pages/forgetPassword/forgetPassword","meta":{},"window":{}}];
__uniConfig.onReady=function(callback){if(__uniConfig.ready){callback()}else{onReadyCallbacks.push(callback)}};Object.defineProperty(__uniConfig,"ready",{get:function(){return isReady},set:function(val){isReady=val;if(!isReady){return}const callbacks=onReadyCallbacks.slice(0);onReadyCallbacks.length=0;callbacks.forEach(function(callback){callback()})}});
service.register("uni-app-config",{create(a,b,c){if(!__uniConfig.viewport){var d=b.weex.config.env.scale,e=b.weex.config.env.deviceWidth,f=Math.ceil(e/d);Object.assign(__uniConfig,{viewport:f,defaultFontSize:Math.round(f/20)})}return{instance:{__uniConfig:__uniConfig,__uniRoutes:__uniRoutes,global:void 0,window:void 0,document:void 0,frames:void 0,self:void 0,location:void 0,navigator:void 0,localStorage:void 0,history:void 0,Caches:void 0,screen:void 0,alert:void 0,confirm:void 0,prompt:void 0,fetch:void 0,XMLHttpRequest:void 0,WebSocket:void 0,webkit:void 0,print:void 0}}}});