const stripeservice=require('../servicios/servicioStripe');
const paypalservice=require('../servicios/servicioPaypal');
const {initializeApp}= require('firebase/app');
const app = initializeApp(JSON.parse(process.env.FIREBASE_CONFIG));
//-----------------CONFIGURACION DE ACCESO: FIREBASE AUTHENTICATION-----------------
const {getAuth, } = require('firebase/auth');
const auth = getAuth(app); // <--- Servicio de acceso a Firebase Authentication

//-----------------CONFIGURACION DE ACCESO: FIRESTORE DATABASE-----------------
const {getFirestore, getDocs, collection,query, where, addDoc} = require('firebase/firestore');
const db = getFirestore(app); // <--- Servicio de acceso a todas las colecciones de la base de datos de Firestore Database


module.exports={
    recuperarProvincias: async (req,res,next)=>{
        try{
            const provincias = await getDocs(collection(db,'provincias'));
            let _provincias = [];
            provincias.forEach((doc) => {
                _provincias.push(doc.data());
            });
            res.status(200).send(_provincias);
        }catch(error){
            console.log('error al recuperar provincias...',error);
            res.status(500).send([]);
        }
    },
    recuperarMunicipios: async (req,res,next)=>{
        try{
            const municipios = await getDocs(query(collection(db,'municipios'),where('CPRO','==',req.params.cpro)));
            let _municipios = [];
            municipios.forEach((doc) => {
                _municipios.push(doc.data());
            });
            res.status(200).send(_municipios);

        }catch(error){
            console.log('error al recuperar municipios...',error);
            res.status(500).send([]);
        }
    },
    FinalizarPedido: async (req,res,next)=>{
        try {
            console.log('Datos recibidos para finalizar pedido...', req.body.pedido.datosPago);
            //Accedemos también a la cabecera Authorization para obtener el token de sesion
            let _token = req.headers.authorization.split(' ')[1];
            
            
            //Accedemo al id de
            let _pedidoInsert={
                idPedido: req.body.idPedido,
                fechaPedido: req.body.fechaPedido,
                estadoPedido: req.body.estadoPedido,
                elementosPedido: req.body.elementosPedido,
                subtotalPedido: req.body.subtotalPedido,
                gastosEnvioPedido: req.body.gastosEnvioPedido,
                totalPedido: req.body.totalPedido,
                datosPago:{
                    tipodireccionenvio: req.body.pedido.datosPago.tipodireccionenvio,
                    direccionEnvio: req.body.pedido.datosPago.direccionEnvio,
                    nombreEnvio: req.body.pedido.datosPago.nombreEnvio,
                    apellidosEnvio: req.body.pedido.datosPago.apellidosEnvio,
                    telefonoEnvio: req.body.pedido.datosPago.telefonoEnvio,
                    emailEnvio: req.body.pedido.datosPago.emailEnvio,
                    otrosDatos: req.body.pedido.datosPago.otrosDatos,
                    tipoDireccionFactura: req.body.pedido.datosPago.tipoDireccionFactura,
                    nombreFactura: req.body.pedido.datosPago.nombreFactura,
                    docfiscalFactura: req.body.pedido.datosPago.docfiscalFactura,
                    direccionFacturacion: 
                    req.body.pedido.datosPago.direccionFacturacion,

                    metodoPago: req.body.pedido.datosPago.metodoPago,
                }
            }
            //let _resultInsert = await addDoc(collection(db,'pedidos'),_pedidoInsert);    
            if(_pedidoInsert.datosPago.metodoPago==='pagopaypal'){

            }                    
        } catch (error) {
            console.log('error al finalizar pedido...', error);
            res.status(403).send(
                {
                    codigo: 1,
                    mensaje: 'error al finalizar pedido en servicio de nodejs contra firebase',
                    error: error.message,
                    datoscliente: null,
                    tokensesion:null,
                    otrosdatos:null
                }
            )
        }
    },
    paypalCallback: async (req,res,next)=>{//OJO este servicio es invocado por paypal cuando el cliente ha finalizado el pago
                //En la url viene parametros: 
        //idcli <--- idcliente que ha hecho el pedido
        //pedido <--- idpedido que ha hecho el pedido
        //cancel <--- true o false
        
        console.log('Parametros recibidos...', req.query);
        let {idcliente,idpedido,cancel}=req.query;
        //necesito obtener el id-pago generado por paypal para el pedido
        
        if(! _finPagoOk || cancel==true) throw new Error('Error al finalizar pago con PAYPAL');
        
        res.status(200).redirect(`http://localhost:4200/Pedido/FinalizarPedidoOk?idcliente=${idcliente}&idpedido=${idpedido}&token=${_jwtSoloUnUso}`);
    },

    /**
      //1º acceder a las claves de desarrollador de la api de paypal
 HttpRequestMessage _requestToken = new HttpRequestMessage(HttpMethod.Post,
                                                           "https://api-m.sandbox.paypal.com/v1/oauth2/token");
 //Cabecera Authorization: Basic con las credenciales en base64
 //Cuerpo de la peticion en formato x-www-form-urlencoded variable: grant_type valor:client_credentials

 string _clientId = this.__iconfig["PayPalAPIKEYS:ClientId"];
 string _clientSecret = this.__iconfig["PayPalAPIKEYS:ClientSecret"];
 string _credenciales = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{_clientId}:{_clientSecret}"));
 _requestToken.Headers.Add("Authorization", $"Basic {_credenciales}");
 _requestToken.Content = new StringContent("grant_type=client_credentials", Encoding.UTF8, "application/x-www-form-urlencoded");
 HttpResponseMessage _responseToken = await cliente.SendAsync(_requestToken);
 if (_responseToken.IsSuccessStatusCode)
 {
     String _respJson = await _responseToken.Content.ReadAsStringAsync();
     JsonNode _respJsonDeserializado = JsonNode.Parse(_respJson);
     String _accessToken = _respJsonDeserializado["access_token"].ToString();
     //Token a añadir a la cabecera Authorization: Bearer para crear el order, confirmarlo y capturarlo

     //2º Crear un order via api-rest de paypal

     HttpRequestMessage _requestOrder = new HttpRequestMessage(HttpMethod.Post, "https://api-m.sandbox.paypal.com/v2/checkout/orders");
     _requestOrder.Headers.Add("Authorization", $"Bearer {_accessToken}");
     var listaItems = pedido.ElementosPedido.Select((ItemPedido unElemento) => new
     {
         name = unElemento.LibroItem.Titulo,
         unit_amount = new
         {
             currency_code = "EUR",
             value = unElemento.LibroItem.Precio.ToString().Replace(",", ".")
         },
         quantity = unElemento.CantidadItem.ToString()
     }).ToList();
     var order = new
     {
         intent = "CAPTURE",
         purchase_units = new[] {
                     new {
                         items=listaItems,
                         amount= new {
                                         currency_code="EUR",
                                         value=pedido.Total.ToString().Replace(",","."),
                                         breakdown=new {
                                             shipping=new { currency_code="EUR", value=pedido.GastosEnvio.ToString().Replace(",",".") },
                                             item_total=new {currency_code="EUR", value=pedido.SubTotal.ToString().Replace(",",".")}
                                         }
                                     }
                     }
         },
         application_context = new
         {
             return_url = $"https://localhost:7286/api/RESTTienda/PaypalCallBack?idcliente={pedido.IdCliente}&idpedido={pedido.IdPedido}",
             cancel_url = $"https://localhost:7286/api/RESTTienda/PaypalCallBack?idcliente={pedido.IdCliente}&idpedido={pedido.IdPedido}&cancel=true"
         }
     };
     _requestOrder.Content = new StringContent(JsonSerializer.Serialize(order), Encoding.UTF8, "application/json");
     HttpResponseMessage _responseOrder = await cliente.SendAsync(_requestOrder);
     if (_responseOrder.IsSuccessStatusCode)
     {
         string _respOrderJson = await _responseOrder.Content.ReadAsStringAsync();
         JsonNode _respOrderJsonDeserializado = JsonNode.Parse(_respOrderJson);
         //Del json de respuesta me interesa: id, que es el id del pago para meterlo en la tabla junto con idcliente e idpedido
         //del array de links, el que contiene approve para mandarselo al cliente blazor para que le redireccione a la pagina de paypal
         String _idOrder = _respOrderJsonDeserializado["id"].ToString();
         String _linkApprove = _respOrderJsonDeserializado["links"].AsArray().Where((JsonNode unLink) => unLink["rel"].ToString() == "approve").Select((JsonNode unLink) => unLink["href"].ToString()).Single<String>();
         //Guardamos el pedido en la tabla pedidos
         this._dbContext.Pedidos.Add(pedido);
         this._dbContext.pedidoPayPal.Add(new PedidoPayPal() { IdCliente = pedido.IdCliente, IdPedido = pedido.IdPedido, OrderId = _idOrder });
         await this._dbContext.SaveChangesAsync();
         return _linkApprove;
     }
 } 
     
     */
}