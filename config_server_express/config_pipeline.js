//Módulo de código nodejs que exporta una función que recibe como parámetro una instancia de express
//creado en el módulo principal y sobre el mismo configuramos los middleware de la pipeline de express
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const config_router_middleware = require("./config_routing_middleware");

module.exports = function (serverExpress) {
  //-----configuracion de la pipeline del servidor express ----
      //middleware de terceros:
    // - cookie-parser: extrae de la pet.del cliente http-request, la cabecera Cookie, extrae su valor y lo mete en una prop.del objeto req.cookie
    // - body-parser: extrae de la pet.del cliente http-rerquest, del body los datos mandados en formato x-www-form-urlenconded o json extrae su valor y los mete en una prop.del objeto req.body
    // - cors: para evitar errores cross-origin-resouce-sharing
  serverExpress.use(cookieParser());
  serverExpress.use(bodyParser.json());
  serverExpress.use(bodyParser.urlencoded({ extended: true }));
  serverExpress.use(cors());
      /*middleware propios:
    - enrutamiento <---- rutas o endpoints del servicio REST(FULL) montado en el servidor express, siempre devuelven datos formato JSON
                        el foramto de estas rutas:   /api/....    
     definido mediante modulo de codigo:  config_routing_middleware <---- exporta una funcion q recibe como
     parametro el serv.express en el cual quiero configurar los endpoints del enrutamiento     
    */
  config_router_middleware(serverExpress);
  

};
