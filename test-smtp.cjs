const nodemailer = require('nodemailer');

const transport = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'alertasmesadeayuda@gmail.com',
    pass: 'psvjmtmkqjfnezdd'
  },
  debug: true,
  logger: true
});

async function run() {
  try {
    console.log('Verificando conexión SMTP...');
    await transport.verify();
    console.log('Conexión exitosa. Intentando enviar correo de prueba...');
    
    const info = await transport.sendMail({
      from: '"Mesa de Ayuda" <alertasmesadeayuda@gmail.com>',
      to: 'gescalidad@concejomunicipalchia.gov.co',
      subject: 'Prueba de correo institucional — Mesa de Ayuda SGC-CMC',
      html: `
        <h2>Prueba de Entrega</h2>
        <p>Este mensaje ha sido enviado desde el sistema <strong>Mesa de Ayuda del Concejo Municipal de Chía (SGC-CMC)</strong> para verificar que los correos llegan correctamente a esta dirección.</p>
        <p>Si recibes este mensaje, el sistema de notificaciones está configurado correctamente.</p>
        <p><em>Enviado: ${new Date().toLocaleString('es-CO')}</em></p>
      `
    });
    console.log('Mensaje enviado exitosamente:', info.messageId);
  } catch (error) {
    console.error('\n!!! ERROR SMTP DETALLADO !!!');
    console.error(error);
  }
}

run();
