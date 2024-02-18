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
const {getFirestore, getDocs, collection,query, where, addDoc, updateDoc, arrayUnion, arrayRemove} = require('firebase/firestore');
const db = getFirestore(app); // <--- Servicio de acceso a todas las colecciones de la base de datos de Firestore Database

function generaRespuesta(codigo,mensaje,errores,token,datoscliente,otrosdatos,res){
  //if(req.body.refreshtoken) token=req.body.refreshtoken;
  res.status(200).send( { codigo,mensaje, errores,token,datoscliente,otrosdatos });

}

module.exports = {
    login:async function(req,res,next){
        try{
          let _userCredential = await signInWithEmailAndPassword(auth, req.body.email, req.body.password);
          //Recuperar de la coleccion clientes los datos del cliente asociados al email de la cuenta
          //Recuperamos el jwt que proporciona firebase tras el login
          let _clienteSnapshot = await getDocs(query(collection(db, 'clientes'),where('cuenta.email','==',req.body.email)));
              res.status(200).send({
                codigo: 0,
                mensaje: "login correcto",
                datoscliente: _clienteSnapshot.docs[0].data(),
                tokensesion: await _userCredential.user.getIdToken(),
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
      RecuperarDatosCliente: async function(req,res,next){
        try{
          let _email = req.params.email;
          console.log('Email del cliente a recuperar datos', _email);
          //Recuperar de la coleccion clientes los datos del cliente asociados al email de la cuenta
          let _clienteSnapshot = await getDocs(query(collection(db, 'clientes'),where('cuenta.email','==',_email)));
          let _datoscliente = _clienteSnapshot.docs.shift().data();
          res.status(200).send({
            codigo: 0,
            mensaje: "recuperacion correcta",
            datoscliente: _datoscliente,
            tokensesion: null,
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
    } ,
    operarDireccion: async (req,res,next)=>{
      console.log(req.body); //{ direccion:..., operacion: ..., email: ...}
      try {
          //recupero de la coleccion clientes el documento con ese email, lanzo query:
      let _refcliente=(await getDocs(query(collection(db,'clientes'),where('cuenta.email','==',req.body.email)))).docs[0];
      console.log('cliente recuperado de firebase-database...', _refcliente.data());

      switch (req.body.operacion) {
          case 'borrar':
              //tengo elimiinar del array de direcciones del objeto cliente recuperado la direccion q nos pasan: arrayRemove
              await updateDoc(_refcliente.ref,{'direcciones': arrayRemove(req.body.direccion)});                
              break;

          case 'crear':
              //tengo q añadir al array de direcciones del objeto cliente recuperado la nueva direccion:  arrayUnion
              await updateDoc(_refcliente.ref,{'direcciones': arrayUnion(req.body.direccion)});
              break;

          case 'fin-modificacion':
              //dos posibilidades: accedes a direccion, la recuperas y vas modificandop prop.por prop o eliminas y añades
              let _direcciones=_refcliente.data().direcciones;
              let _posmodif=_direcciones.findIndex( direc=>direc.idDireccion==req.body.direccion.idDireccion);
              _direcciones[_posmodif]=req.body.direccion;

              await updateDoc(_refcliente.ref, {'direcciones': _direcciones });
              break;
      }

      //OJO!!! si usas la ref.al documento cliente de arriba, es un snapshot...no esta actualizada!!!! a las nuevas
      //direcciones, tienes q volver a hacer query...esto no vale:
      //let _clienteActualizado=(await getDoc(doc(db,'clientes',_refcliente.id))).data();
      let _clienteActualizado=(await getDocs(query(collection(db,'clientes'),where('cuenta.email','==',req.body.email)))).docs[0].data();

      console.log('cliente actualizado mandado en el restmessage....',_clienteActualizado);

      generaRespuesta(0,`${req.body.operacion} sobre direccion realizada OK!!`,null,'',_clienteActualizado,'',res);

      } catch (error) {
          console.log('error en operar direcciones...', error);
          generaRespuesta(6,`fallo a la hora de ${req.body.operacion} sobre direccion ${req.body.direccion.calle} al guardar en bd...`,error,null,null,null,res);
      }
    },
    };