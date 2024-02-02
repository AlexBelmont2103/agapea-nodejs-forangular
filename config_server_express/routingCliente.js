//modulo de codigo para definir endpoints de la zona cliente con sus respectivas funciones middleware para su procesamiento
//se meten en objeto router y este se exporta
const express = require("express");
const jwt = require('jsonwebtoken');
const router = express.Router(); //objeto router de express para definir endpoints de la zona cliente
//----- funcion middleware check JWT mandado por el cliente react ------------

//añado endpoints de la zona cliente y funciones middleware importadas desde un objeto js que funciona como si fuese un "controlador"
// a ese objeto router
const clienteController = require("../controllers/clienteController");
router.post("/Registro", clienteController.registro); //endpoint de la zona cliente para registrar un nuevo cliente
router.post("/Login", clienteController.login); //endpoint de la zona cliente para logarse un cliente
router.get('/ComprobarEmail', clienteController.comprobarEmail); //endpoint de la zona cliente para recuperar emails de clientes
router.get('/ActivarCuenta', clienteController.activarCuenta); //endpoint de la zona cliente para activar cuenta de cliente
module.exports = router; //exporto objeto router con endpoints de la zona cliente y sus funciones middleware