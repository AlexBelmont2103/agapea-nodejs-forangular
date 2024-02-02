const routingCliente = require('./routingCliente'); // modulo routingCliente
const routingTienda = require('./routingTienda'); // modulo routingTienda
const routingPedido = require('./routingPedido'); // modulo routingPedido

module.exports = function (serverExpress) {
    serverExpress.use('/api/Cliente', routingCliente) // en modulo routingCliente están endpoints de la entidad Cliente
                                                    //en este fichero se exporta objeto express tipo Router
    serverExpress.use('/api/Tienda', routingTienda) // en modulo routingTienda están endpoints de la entidad Tienda
                                                    //en este fichero se exporta objeto express tipo Router
    serverExpress.use('/api/Pedido', routingPedido) // en modulo routingPedido están endpoints de la entidad Pedido
};