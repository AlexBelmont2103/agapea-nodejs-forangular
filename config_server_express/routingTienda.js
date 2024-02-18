const express = require("express");
const router = express.Router(); //objeto router de express para definir endpoints de la zona cliente
const tiendaController = require("../controllers/tiendaController");
router.get('/RecuperarCategorias/:idcategoria', tiendaController.recuperarCategorias);
router.get('/RecuperarLibros/:idcategoria', tiendaController.recuperarLibros);
router.get('/BuscarLibros/:busqueda', tiendaController.BuscarLibros);
router.get('/RecuperarLibro/:isbn13', tiendaController.recuperarLibro);
router.get('/RecuperarComentarios/:idlibro', tiendaController.recuperarComentarios);
router.post('/EnviarComentario', tiendaController.enviarComentario);
router.post('/EditarComentario', tiendaController.editarComentario);





module.exports = router;