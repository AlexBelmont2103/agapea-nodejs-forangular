//modulo de nodejs donde exporto objeto js que tiene como props las funciones middleware
//que necesita el objeto router express de zona cliente
//Para inicializar Firebase, hay que meter un fichero de configuracion
const {initializeApp}= require('firebase/app');
const app = initializeApp(JSON.parse(process.env.FIREBASE_CONFIG));
                                                //ESTE NOMBRE ES OBLIGATORIAMENTE ASÍ
const Mailjet = require('node-mailjet');
const mailjet = Mailjet.apiConnect(
  process.env.MJ_APIKEY_PUBLIC,
  process.env.MJ_APIKEY_PRIVATE,
);

//-----------------CONFIGURACION DE ACCESO: FIREBASE AUTHENTICATION-----------------
const {getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, checkActionCode, applyActionCode} = require('firebase/auth');
const auth = getAuth(app); // <--- Servicio de acceso a Firebase Authentication

//-----------------CONFIGURACION DE ACCESO: FIREBASE STORAGE-----------------
const {getStorage, ref, uploadString} = require('firebase/storage');
const storage = getStorage(app); // <--- Servicio de acceso a Firebase Storage

//-----------------CONFIGURACION DE ACCESO: FIRESTORE DATABASE-----------------
const {getFirestore, getDocs, collection,query, where, addDoc} = require('firebase/firestore');
const db = getFirestore(app); // <--- Servicio de acceso a todas las colecciones de la base de datos de Firestore Database

module.exports = {
    login:async function(req,res,next){
        try{
          console.log('Datos recibidos desde el cliente de Angular', req.body);
          let _userCredential = await signInWithEmailAndPassword(auth, req.body.email, req.body.password);
          console.log('Resultado del login en firebase authentication', _userCredential.user);
          //Recuperar de la coleccion clientes los datos del cliente asociados al email de la cuenta
          //Recuperamos el jwt que proporciona firebase tras el login
          let _clienteSnapshot = await getDocs(query(collection(db, 'clientes'),where('cuenta.email','==',req.body.email)));
          req.session.jwt = await _userCredential.user.getIdToken();
          req.session.user = _clienteSnapshot.docs[0].data();
          console.log('Datos del cliente en sesion', req.session.jwt);
          console.log('Datos del cliente en sesion', req.session.user);
              res.status(200).send({
                codigo: 0,
                mensaje: "login correcto",
                datoscliente: req.session.user,
                tokensesion: req.session.jwt,
                otrosdatos: null,
              });
          }catch(error){
            console.log('error al hacer el login', error);
            res.status(500).send({
              codigo: 1,
              mensaje: "error a la hora de hacer el login",
              error: error.message,
              datoscliente:null,
              tokensesion:null,
              otrodatos:null
            });
          }
    },
    registro:async function(req,res,next){
        try {
          
          let _cliente = {
            nombre: req.body.nombre,
            apellidos: req.body.apellidos,
            telefono: req.body.telefono,
            cuenta: {
              email: req.body.email,
              password: req.body.password,
            },
          };
          console.log("Datos recibidos por el cliente de Angular", _cliente);
           //1º paso: crear cuenta en firebase authentication
          let _userCredential = await createUserWithEmailAndPassword(auth,_cliente.cuenta.email, _cliente.cuenta.password);
          console.log("Resultado de registro en firebase authentication", _userCredential);
          //2º paso: Mandar email de activacion de cuenta
          await sendEmailVerification(_userCredential.user);
          //3º paso: insertar datos del cliente en coleccion clientes
          let _clienteRef = await addDoc(collection(db, 'clientes'), _cliente);
          console.log("Resultado de registro en coleccion clientes", _clienteRef);
           res.status(200).send({
              codigo: 0,
              mensaje: "registro correcto",
              datoscliente: _cliente,
              tokensesion: null,
           });
          } catch (error) {
            console.log("error al hacer el insert en coleccion clientes", error);
            res.status(500).send({
              codigo: 0,
              mensaje: "error a la hora de insertar datos del cliente",
            });
          }
    },
    comprobarEmail: async function(req,res,next){
        try{
          console.log('Datos recibidos desde el cliente de Angular', req.query);
          let _clienteSnapshot = await getDocs(query(collection(db, 'clientes'),where('cuenta.email','==',req.query.email)));
          let _datoscliente = _clienteSnapshot.docs.shift().data();
          console.log('Resultado de la query de clientes: ', _datoscliente);
          if(_datoscliente){
            res.status(200).send({
              codigo: 0,
              mensaje: "email correcto",
              datoscliente: _datoscliente,
              tokensesion: null,
              otrodatos: null,
            });
          }else{
            throw new Error('email incorrecto');
          }
        }catch(error){
          console.log('error al comprobar el email', error);
          res.status(500).send({
            codigo: 1,
            mensaje: "error a la hora de comprobar el email",
            error: error.message,
            datoscliente:null,
            tokensesion:null,
            otrodatos:null
          });
        }
      },
      activarCuenta: async function(req,res,next){
        try{
          let{mode, oobCode, apiKey} = req.query;
          //Comprobar si el token de activacion es para verificar el email
          //lo idea seria comprobar que el token enviado pertenece al usuario que quiere activar la cuenta (email)
          let _actionCodeInfo = await checkActionCode(auth, oobCode); //Devuelve objeto de clase ActionCodeInfo
          console.log('Resultado de checkActionCode', _actionCodeInfo);
          if(_actionCodeInfo.operation === 'VERIFY_EMAIL'){
            //Si el token es para verificar el email, buscar el cliente en la coleccion clientes a traves del email
            
            await applyActionCode(auth, oobCode);

            
            console.log('Email verificado correctamente');
            res.status(200).send({
              codigo: 0,
              mensaje: "email verificado correctamente",
              error: null,
              datoscliente:null,
              tokensesion:null,
              otrodatos:null
            });
          }else{
            throw new Error('token de activacion incorrecto');
          }
        }catch(error){
          console.log('error al activar la cuenta', error);
          res.status(500).send({
            codigo: 1,
            mensaje: "error a la hora de activar la cuenta",
            error: error.message,
            datoscliente:null,
            tokensesion:null,
            otrodatos:null
          });
        }

      },
      recuperarDatosCliente(req,res,next){
        //Recuperar los datos del cliente a traves de la sesion
        try{
          console.log('Datos del cliente en el servidor', req.session.user);
          res.status(200).send({
            codigo: 0,
            mensaje: "recuperacion correcta",
            datoscliente: req.session.user,
            tokensesion: req.session.jwt,
            otrodatos: null,
          });
        }catch(error){
          console.log('error al recuperar datos del cliente', error);
          res.status(500).send({
            codigo: 1,
            mensaje: "error a la hora de recuperar datos del cliente",
            error: error.message,
            datoscliente:null,
            tokensesion:null,
            otrodatos:null
          });
        }
        
      },
      uploadImagen: async (req,res,next)=>{
        try {
            //tengo q coger la extension del fichero, en req.body.imagen:  data:image/jpeg
            let _nombrefichero='imagen____' + req.body.emailcliente;//  + '.' + req.body.imagen.split(';')[0].split('/')[1]   ;
            console.log('nombre del fichero a guardar en STORGE...',_nombrefichero);
            let _result=await uploadString(ref(storage,`imagenes/${_nombrefichero}`), req.body.imagen,'data_url'); //objeto respuesta subida UploadResult         
        
            //podrias meter en coleccion clientes de firebase-database en prop. credenciales en prop. imagenAvatar
            //el nombre del fichero y en imagenAvatarBASE&$ el contenido de la imagen...
            let _refcliente=await getDocs(query(collection(db,'clientes'),where('cuenta.email','==',req.body.emailcliente)));
            _refcliente.forEach( async (result) => { 
                await updateDoc(result.ref, { 'cuenta.imagenAvatarBASE64': req.body.imagen } );
            });
            
            generaRespuesta(0,'Imagen avatar subida OK!!! al storage de firebase','',null,null,null,res );
        } catch (error) {
            console.log('error subida imagen...',error);
            generaRespuesta(5,'fallo a la hora de subir imagen al storage',error,null,null,null,res);

        }
    } 
    };