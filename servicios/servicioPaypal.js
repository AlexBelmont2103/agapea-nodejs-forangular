const axios = require('axios');
const {initializeApp}= require('firebase/app');
const app = initializeApp(JSON.parse(process.env.FIREBASE_CONFIG));
const {getFirestore, getDocs, collection,query, where, addDoc} = require('firebase/firestore');
const db = getFirestore(app); // <--- Servicio de acceso a todas las colecciones de la base de datos de Firestore Database

async function getAccesTokenPAYPAL(){
    //Para obtener token de servicio paypal debo pasar en base64 la combinacion de "clientID:secretID" 
    //en cabecera Authorization: Basic
    //y en body grant_type:client_credentials
    //y en cabecera Content-Type:application/x-www-form-urlencoded
    let _base64Auth = Buffer.from(process.env.PAYPAL_CLIENT_ID+":"+process.env.PAYPAL_SECRET_ID).toString('base64');
    try{
        let _response = await axios({
            method: 'post',
            url: 'https://api-m.sandbox.paypal.com/v1/oauth2/token',
            data: 'grant_type=client_credentials',
            headers:{
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${_base64Auth}`
            }
        })
        if(_response.status === 200){
            console.log("Auth token PAYPAL: ", _response.data);
            let accessToken = _response.data.access_token;

            return accessToken;
        }else{
            throw new Error(`Error en getAccessTokenPAYPAL: ${JSON.stringify(_response.data)}`);        }
    }catch(error){
        console.log("Error en getAccesTokenPAYPAL: ", error);
    }
}
module.exports = {
    crearPagoPAYPAL:async function(email, pedido){
        console.log("datos del pedido..", pedido);
        try{
            let _accessToken = await getAccesTokenPAYPAL();
            if(_accessToken == null) throw new Error("Error en crearPagoPAYPAL: ", error);

                let _order={
                    intent: "CAPTURE",
                    purchase_units:[
                        {
                            items: pedido.elementosPedido.map(elem => {
                                return {
                                    name: elem.libroElemento.Titulo,
                                    unit_amount:{
                                        currency_code: "EUR",
                                        value: elem.libroElemento.Precio.toString()
                                    },
                                    quantity: elem.cantidadElemento.toString()
                                }
                            }),
                            amount:{
                                currency_code: "EUR",
                                value: pedido.totalPedido.toString(),
                                breakdown:{
                                    item_total:{
                                        currency_code: "EUR",
                                        value: pedido.subtotalPedido.toString()
                                    },
                                    shipping:{
                                        currency_code: "EUR",
                                        value: pedido.gastosEnvioPedido.toString()
                                    },
                                }
                            },

                        }
                    ],
                    application_context:{
                        return_url: `http://localhost:5000/api/Pedido/PayPalCallBack?email=${email}&idpedido=${pedido.idPedido}`,
                        cancel_url: `http://localhost:5000/api/Pedido/PayPalCallBack?email=${email}&idpedido=${pedido.idPedido}&Cancel=true`
                    }
                };
                console.log("Objeto order para crear pago PAYPAL: ", _order);
            
                let _response = await axios(
                    {
                        method: 'POST',
                        url:'https://api.sandbox.paypal.com/v2/checkout/orders',
                        data: JSON.stringify(_order),
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${_accessToken}`
                        }
                    }
                )
                console.log("Respuesta crearPagoPAYPAL: ", _response);
                console.log('links de la respuesta...', _response.data.links);
                if(_response.status === 201 || _response.status === 200){//A veces devuelve 201 y otras 200
                    //En _response.data necesito el id del pago y prop links que es un array de objetos con href y rel
                    //el que tenga .rel == "approve" es el que necesito para redireccionar al cliente
                    let _pagoPayPal = {
                        idcliente: email,
                        idpedido: pedido.idPedido,
                        idpago: _response.data.id
                    };
                    let _docRef = await addDoc(collection(db, 'pagosPayPal'), _pagoPayPal);
                    return _response.data.links.filter( link=>link.rel==='approve')[0].href;
                }else{
                    throw new Error("Error en crearPagoPAYPAL: ");
                }
        }catch(error){
            console.log("Error en crearPagoPAYPAL: ", error);
            return null;
        }
    },
    finalizarPagoPAYPAL:async function(orderid){
        try{
            let _accessToken = await getAccesTokenPAYPAL();
            if(_accessToken === null) throw new Error("Error en finalizarPagoPAYPAL: ", error);
            let _response = await axios({
                method: 'post',
                url: `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderid}/capture`,
                headers:{
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${_accessToken}`
                }
            });
            console.log("Respuesta finalizarPagoPAYPAL: ", _response);
            if(_response.status === 201 || _response.status === 200){//A veces devuelve 201 y otras 200
                return true;
            }else{
                throw new Error("Error en finalizarPagoPAYPAL: ");
            }
        }catch(error){
            console.log("Error en finalizarPagoPAYPAL: ", error);
        }
    }
};