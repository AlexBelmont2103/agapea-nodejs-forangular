const stripeservice=require('../servicios/servicioStripe');
const {initializeApp}= require('firebase/app');
const app = initializeApp(JSON.parse(process.env.FIREBASE_CONFIG));
//-----------------CONFIGURACION DE ACCESO: FIREBASE AUTHENTICATION-----------------
const {getAuth} = require('firebase/auth');
const auth = getAuth(app); // <--- Servicio de acceso a Firebase Authentication

//-----------------CONFIGURACION DE ACCESO: FIRESTORE DATABASE-----------------
const {getFirestore, getDocs, collection,query, where} = require('firebase/firestore');
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
    finalizarPedido: async (req,res,next)=>{
        try {
                        
        } catch (error) {
            console.log('error al finalizar pedido...', error);
            res.status(403).send(
                {
                    codigo: 1,
                    mensaje: 'error al finalizar pedido en servicio de nodejs contra mongodb',
                    error: error.message,
                    datoscliente: null,
                    tokensesion:null,
                    otrosdatos:null
                }
            )
        }
    },
    paypalCallback: async (req,res,next)=>{//OJO este servicio es invocado por paypal cuando el cliente ha finalizado el pago
    },
}