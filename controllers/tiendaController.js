const {initializeApp}= require('firebase/app');
const app = initializeApp(JSON.parse(process.env.FIREBASE_CONFIG));
//-----------------CONFIGURACION DE ACCESO: FIREBASE AUTHENTICATION-----------------
const {getAuth} = require('firebase/auth');
const auth = getAuth(app); // <--- Servicio de acceso a Firebase Authentication

//-----------------CONFIGURACION DE ACCESO: FIRESTORE DATABASE-----------------
const {getFirestore, getDocs, collection,query, where} = require('firebase/firestore');
const db = getFirestore(app); // <--- Servicio de acceso a todas las colecciones de la base de datos de Firestore Database

module.exports = {
    recuperarCategorias:async function(req,res,next){
      try {
        var _idcategoria=req.params.idcategoria;
        let _categorias = [];
        var _patron=_idcategoria==='padres' ?  new RegExp("^\\d{1,}$") : new RegExp("^" + _idcategoria + "-\\d{1,}$");
        const _cats = await getDocs(collection(db,'categorias'));
        _cats.forEach((doc) => {
          if(_patron.test(doc.data().IdCategoria)){
            _categorias.push(doc.data());
          }
        });
        res.status(200).send(_categorias);
    } catch (error) {
    console.log('error al recuperar categorias...',error);
    res.status(500).send( [] );
    } 
    },
    recuperarLibros:async function(req,res,next){
        try{
            let _libros = [];
            //El patron debe ser: empieza por idcategoria y puede contener guiones y mas digitos
            //idcategoria-2 y también idcategoria-2-3
            let _patron = new RegExp('^' + req.params.idcategoria + '(-\\d+)*$');
            
            //Seleccionamos todos los libros de la coleccion, y luego filtramos por patrón
            const _librosSnap = await getDocs(collection(db,'libros'));
            
            _librosSnap.forEach((doc) => {
              //Si contiene el patrón, lo añadimos al array de libros
              if(_patron.test(doc.data().IdCategoria)){
                _libros.push(doc.data());
              }
            });
            res.status(200).send(_libros);
          }catch(error){
            console.log("Error al enviar libros", error);
            res.status(500).send([]);
        }
    },
    recuperarLibro:async function(req,res,next){
        try{
          //Buscamos en la coleccion libros de firestore el libro con el isbn13 recibido
          const _librosSnap = await getDocs(query(collection(db,'libros'),where('ISBN13','==',req.params.isbn13)));
          let _libro = {};
          _librosSnap.forEach((doc) => {
            _libro = doc.data();
          });
          res.status(200).send(_libro);
        }catch(error){
          console.log("Error al enviar libro", error);
          res.status(500).send(error);
        }
    },
    recuperarComentarios:async function(req,res,next){
        try{
          
          }catch(error){
            console.log("Error al enviar comentarios", error);
            res.status(500).send([]);
          }
    },
    enviarComentario:async function(req,res,next){
        try{
          
        }catch(error){
          console.log("Error al enviar comentario", error);
          res.status(500).send([]);
        }
    },
    editarComentario: async function (req, res, next) {
        try {
          
        } catch (error) {
          console.log("Error al enviar comentario", error);
          res.status(500).send([]);
        }
      },
};