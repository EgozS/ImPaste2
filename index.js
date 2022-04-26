var express = require('express');
var app = express();
var bodyParser = require('body-parser');
const session = require('express-session')
const mysql = require('mysql');
const config = require('./config.json')
const multer = require('multer');

var con = mysql.createConnection({
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database
});

var port = 80;

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/')
    },
    filename: function (req, file, cb) {
        var ranInt = randomImgId(12);
        req.session.imgId = ranInt;
        var imgName = file.originalname.split(".")[0]
        imgName = imgName.replace(/\s+/g, '-');
        cb(null, `${imgName}${ranInt}.png`);
    }
})


const upload = multer({storage: storage});


app.use(session({
    secret: config.secret,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
    }))


app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/uploads'));
app.use(bodyParser.json());
app.set('views', __dirname + '/views');

function randomImgId(length) {
    var result           = '';
    var characters       = '0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }

    con.query('SELECT * FROM pastes WHERE id = ?', [result], function(err, rows, fields) {
        if (err) throw err
        if (rows.length > 0) {
         randomImgId(length)
        } else {
            return result
        }
    })
   return result;
}


app.get('/', (req, res) => {
    res.render('index');
})

app.get('/photo/:id', (req, res) => {
    var id = req.params.id;
    con.query('SELECT * FROM pastes WHERE id = ?', [id], function(err, rows, fields) {
        if (err) throw err
        if (rows.length > 0) {
            var img = rows[0].path;
            var filename = rows[0].filename;
            var date = rows[0].creation;
            var url = rows[0].url;
            res.render('tamplate/tamplate2', {path: img, filename: filename, date: date, url: url});
        } else {
            res.render('404');
        }       
    }
    )
})

app.post('/upload', upload.single("pic"), function (req, res) {
    var img = req.file;
    var imgId = req.session.imgId;
    var url = `/photo/${imgId}`;
    var path = img.path.replace("uploads\\", "");
    con.query('INSERT INTO pastes (id, path, url, filename) VALUES (?, ?, ?, ?)', [imgId, path, url, img.filename], function(err, rows, fields) {
        if (err) throw err
        res.redirect(url);
    })
})

// app.get('/login', (req, res) => {
//     res.render('accounts/login');
// })

// app.get('/register', (req, res) => {
//     res.render('accounts/register');
// })

app.listen(port, (req, res) => {
    console.log('http://localhost:' + port);
})

