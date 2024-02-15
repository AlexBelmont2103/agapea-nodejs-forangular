const express = require("express");
const router = express.Router();
const pedidoController = require("../controllers/pedidoController");


router.post('/FinalizarPedido',pedidoController.FinalizarPedido);
router.get('/PayPalCallback', pedidoController.paypalCallback);
router.get('/RecuperarProvincias', pedidoController.recuperarProvincias);
router.get('/RecuperarMunicipios/:cpro', pedidoController.recuperarMunicipios);


module.exports = router;