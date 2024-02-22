const express = require('express');
const app = express();
const session = require('express-session');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const dateFormat = require('dateformat');
const ejs = require('ejs');
const fs = require('fs');
const bcrypt = require('bcrypt');
const pdf = require("html-pdf");
const mysql = require('mysql2');

app.use(session({
    secret: '2C44-4D44-WppQ38S',
    resave: true,
    saveUninitialized: true
}));

const auth = function (req, res, next) {
    if (req.session && req.session.user && req.session.admin)
        return next();
    else {
        var msg = "You have to login first";
        return res.redirect('/login');
    }
};

app.get('/logout', function (req, res) {
    req.session.destroy();
    res.redirect('/login');
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({
    storage: storage
}).single('img');

const con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'faith',
    database: 'mydb',
});

app.set('view-engine', 'ejs');

app.get('/', (req, res) => {
    res.render('login.ejs', { name: 'NID' });
});

app.get('/login', (req, res) => {
    res.render('login.ejs');
});

app.post('/login', (req, res) => {
    const email = req.body.lemail;
    const password = req.body.lpass;

    con.query('SELECT * FROM users WHERE email = ?', [email], async (error, results, fields) => {
        if (error) {
            console.error("Error ocurred during login:", error);
            return res.status(500).send({
                "code": 500,
                "failed": "Internal Server Error"
            });
        }

        if (results.length > 0) {
            const storedPassword = results[0].pass;

            const passwordMatch = await bcrypt.compare(password, storedPassword);

            if (passwordMatch) {
                req.session.user = "yes";
                req.session.admin = true;
                return res.redirect('/index');
            } else {
                console.error("Password does not match");
                const id = "password not match";
                return res.redirect('/notifi/' + id);
            }
        } else {
            console.error("Email not found");
            const id = "email not exists";
            return res.redirect('/notifi/' + id);
        }
    });
});

app.get('/notifi/:id', (req, res) => {
    var id = req.params.id;
    var data = {
        msg: id
    };
    var data = { data: data };
    res.render("notifi.ejs", data);
});

app.get('/register', (req, res) => {
    res.render('register.ejs');
});

app.post('/register', async (req, res) => {
    try {
        const email = req.body.email;
        const existingUser = await getUserByEmail(email);

        if (existingUser) {
            return res.redirect("/notifi/Email Already Exists");
        }

        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        const userData = {
            "name": req.body.name,
            "email": email,
            "father_name": req.body.father,
            "likee": req.body.like,
            "pass": hashedPassword,
            "time": dateFormat(new Date(), "yyyy-mm-dd")
        };

        await insertUser(userData);

        res.redirect("/login");
    } catch (error) {
        console.error("Error in registration:", error);
        res.status(500).json({
            code: 500,
            failed: "Internal server error"
        });
    }
});

async function getUserByEmail(email) {
    try {
        const results = await queryAsync('SELECT * FROM users WHERE email = ?', [email]);
        return results[0];
    } catch (error) {
        throw error;
    }
}

async function insertUser(userData) {
    try {
        await queryAsync('INSERT INTO users SET ?', userData);
    } catch (error) {
        throw error;
    }
}

function queryAsync(sql, values) {
    return new Promise((resolve, reject) => {
        con.query(sql, values, (error, results, fields) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

app.get('/index', auth, (req, res) => {
    let datee = new Date((new Date()).getTime());
    datee = datee.toISOString().slice(0, 10);

    con.query(`SELECT COUNT(Time) as  t FROM schedule WHERE Time = '${datee}' AND status = 'unpaid'`, function (err, result) {
        if (err) {
            throw err;
        } else {
            obj = { print: result };
            res.render('index.ejs', obj);
        }
    });
});

app.get('/scheme', auth, (req, res) => {
    res.render('scheme.ejs', { print: "nid" });
});

app.get('/cus_register', auth, (req, res) => {
    con.query('SELECT * FROM scheme', function (err, result) {
        if (err) {
            throw err;
        } else {
            obj = { print: result };
            res.render('cus_register.ejs', obj);
        }
    });
});

app.post('/cus_register', auth, (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            return res.end("Error uploading file.");
        } else {
            var name = req.body.name;
            var phone = req.body.phone;
            var address = req.body.address;
            var scheme = req.body.scheme;
            var date = new Date();
            var time = dateFormat(date, "yyyy-mm-dd");
            var image = req.file.filename;

            var values = [
                [name, phone, scheme, time, image]
            ];

            con.query('INSERT INTO schedule (cus_name, Father_name, Gender, Time, Image) VALUES ?', [values], function (err, result) {
                if (err) {
                    throw err;
                } else {
                    res.redirect('/print/' + result.insertId);
                }
            });
        }
    });
});



app.get('/cus_detail', auth, (req, res) => {
    con.query('SELECT * FROM schedule ORDER BY Id DESC', function (err, result) {
        if (err) {
            throw err;
        } else {
            obj = { print: result };
            res.render('cus_detail.ejs', obj);
        }
    });
});

app.get('/print/:id', auth, (req, res) => {
    var id = req.params.id;

    // Check if id is not provided or is not a valid number
    if (!id || isNaN(id)) {
        var msg = 'Invalid ID provided';
        var obj = { print: null, msg: msg };
        return res.render('print.ejs', obj);
    }

    con.query('SELECT * FROM schedule WHERE install_no = ?', [id], function (err, result) {
        if (err) {
            throw err;
        } else {
            var msg = '';
            var obj = { print: result, msg: msg };

            // Check if no results are found
            if (result.length === 0) {
                msg = 'No schedule entry found with the provided ID';
                obj.msg = msg;
            }

            res.render('print.ejs', obj);
        }
    });
});


/** app.get('/print/:id', auth, (req, res) => {
    var id = req.params.id;
    con.query('SELECT * FROM schedule WHERE Id = ?', [id], function (err, result) {
        if (err) {
            throw err;
        } else {
            var msg = '';
            var obj = { print: result, msg: msg };
            res.render('print.ejs', obj);
        }
    });
});
**/
app.post('/print', auth, (req, res) => {
    var id = req.body.ids;
    var scheme = req.body.scheme;
    var date = new Date();
    var time = dateFormat(date, "yyyy-mm-dd");

    con.query(`UPDATE schedule SET Time = '${time}', Status = 'unpaid' WHERE Id = ?`, [id], function (err, result) {
        if (err) {
            throw err;
        } else {
            res.redirect('/print/' + id);
        }
    });
});

app.get('/indexx', auth, (req, res) => {
    con.query('SELECT * FROM schedule WHERE status = ?', ['unpaid'], function (err, result) {
        if (err) {
            throw err;
        } else {
            obj = { print: result };
            res.render('indexx.ejs', obj);
        }
    });
});

app.get('/report', auth, (req, res) => {
    res.render('report.ejs');
});

app.post('/report', auth, (req, res) => {
    var from_date = req.body.from_date;
    var to_date = req.body.to_date;

    con.query(`SELECT * FROM schedule WHERE Time BETWEEN '${from_date}' AND '${to_date}'`, function (err, result) {
        if (err) {
            throw err;
        } else {
            obj = { print: result };
            res.render('report.ejs', obj);
        }
    });
});

app.get('/old_report', auth, (req, res) => {
    res.render('old_report.ejs');
});

app.post('/old_report', auth, (req, res) => {
    var from_date = req.body.from_date;
    var to_date = req.body.to_date;

    con.query(`SELECT * FROM schedule WHERE status = 'paid' AND Time BETWEEN '${from_date}' AND '${to_date}'`, function (err, result) {
        if (err) {
            throw err;
        } else {
            obj = { print: result };
            res.render('old_report.ejs', obj);
        }
    });
});

app.get('/pdf_report', auth, (req, res) => {
    var from_date = req.query.from_date;
    var to_date = req.query.to_date;

    con.query(`SELECT * FROM schedule WHERE Time BETWEEN '${from_date}' AND '${to_date}'`, function (err, result) {
        if (err) {
            throw err;
        } else {
            var data = { print: result };
            ejs.renderFile('./views/pdf_report.ejs', data, (err, html) => {
                if (err) {
                    console.error("Error in rendering PDF:", err);
                    return res.status(500).send("Internal Server Error");
                }

                const pdfOptions = {
                    format: 'Letter',
                    orientation: 'portrait',
                    border: {
                        top: '0.5in',
                        right: '0.5in',
                        bottom: '0.5in',
                        left: '0.5in'
                    }
                };

                pdf.create(html, pdfOptions).toFile('./public/reports/report.pdf', (err, result) => {
                    if (err) {
                        console.error("Error creating PDF:", err);
                        return res.status(500).send("Internal Server Error");
                    }

                    res.redirect('/download');
                });
            });
        }
    });
});

app.get('/download', auth, (req, res) => {
    const file = `${__dirname}/public/reports/report.pdf`;
    res.download(file);
});

app.get('/receipt', auth, (req, res) => {
    var id = req.query.id;
    con.query('SELECT * FROM schedule WHERE Id = ?', [id], function (err, result) {
        if (err) {
            throw err;
        } else {
            var data = { print: result };
            ejs.renderFile('./views/receipt.ejs', data, (err, html) => {
                if (err) {
                    console.error("Error in rendering receipt:", err);
                    return res.status(500).send("Internal Server Error");
                }

                const pdfOptions = {
                    format: 'Letter',
                    orientation: 'portrait',
                    border: {
                        top: '0.5in',
                        right: '0.5in',
                        bottom: '0.5in',
                        left: '0.5in'
                    }
                };

                pdf.create(html, pdfOptions).toFile('./public/receipts/receipt.pdf', (err, result) => {
                    if (err) {
                        console.error("Error creating receipt:", err);
                        return res.status(500).send("Internal Server Error");
                    }

                    res.redirect('/download_receipt');
                });
            });
        }
    });
});

app.get('/download_receipt', auth, (req, res) => {
    const file = `${__dirname}/public/receipts/receipt.pdf`;
    res.download(file);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
