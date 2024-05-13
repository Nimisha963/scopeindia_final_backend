const multer = require('multer');
const productstorage = multer.diskStorage({
    destination : (req,file,cb)=>{
        cb(null,'uploads/avatar/')
    },
    filename : (req,file,cb)=>{
        console.log(file.mimetype);
        let extension = file.mimetype.split('/')[1];
        cb(null,`avatar_${Date.now()}.${extension}`);
    }
});
var productUpload = multer({ storage:productstorage })
module.exports = productUpload