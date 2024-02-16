//------- modulo principal de entrada app. nodejs config express con mongo -------
//- definimos instancia de express
//- definimos instancia de mongo
//-lanzamos ambos servers
require("dotenv").config(); //<--PAQUETE PARa definir como variable de entorno en fihcero .env valores criticos
const express = require("express"); //<-- en la variable express se almaacena la funccion q genera el servidor web, exportada por el modulo
const session = require('express-session'); //<--paquete para gestionar sesiones en express
var serverExpress = express();

const configServer = require("./config_server_express/config_pipeline");

//-----configuracion de express
serverExpress.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true,
    cookie:{secure: true,maxAge: 24 * 60 * 60 * 1000}
}))

serverExpress.listen(5000, () => console.log("servidor web express eschuchando por el puerto 5000"));
configServer(serverExpress);  //<--configuracion de la pipeline del servidor express

