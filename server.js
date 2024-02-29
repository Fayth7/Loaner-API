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
    let datee = new Date().toISOString().slice(0, 10);

    con.query(`SELECT COUNT(date) as t FROM customer_registration WHERE date = '${datee}'`, function (err, result) {
        if (err) {
            throw err;
        } else {
            obj = { print: result };
            res.render('index.ejs', obj);
        }
    });
});


// Add customer Loan details
app.post('/add_loan', (req, res) => {
  const { customer_id, loan_amount, interest_rate, loan_duration, start_date } = req.body;

  // Insert into add_loan table
  pool.query(
    'INSERT INTO add_loan (customer_id, loan_amount, interest_rate, loan_duration, start_date) VALUES (?, ?, ?, ?, ?)',
    [customer_id, loan_amount, interest_rate, loan_duration, start_date],
    (err, results) => {
      if (err) {
        console.error('Error inserting loan details:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        console.log('Loan details inserted successfully.');
        res.status(200).json({ message: 'Loan details inserted successfully.' });
      }
    }
  );
});

app.get('/add_loan', (req, res) => {
    res.render('add_loan.ejs');
});

app.get('/type', auth, (req, res) => {
    res.render('type.ejs', { print: "nid" });
});

app.post('/cus_register', auth, (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            return res.end("Error uploading file.");
        } else {
            var name = req.body.name;
            var phone = req.body.contact;
            var address = req.body.address;
            var type = req.body.type;
            var date = new Date().toISOString().slice(0, 10);
            var image = req.file.filename;
            var customerSecurity = req.body.customer_security;  // New field
            var securityPrice = req.body.security_price;  // New field

            var values = [name, phone, address, type, date, image, customerSecurity, securityPrice];  // Include new fields

            con.query(`SELECT * FROM type WHERE type_id = ?`, [type], function (error, results) {
                if (error) {
                    res.send(error);
                }

                con.query('INSERT INTO customer_registration (customer_name, customer_contact, customer_address, loan_type, date, image_path, customer_security, security_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', values, function (err, result) {
                    if (err) {
                        throw err;
                    } else {
                        res.redirect('/print/' + result.insertId);
                    }
                });
            });
        }
    });
});


app.get('/cus_register', auth, (req, res) => {
    con.query('SELECT * FROM type', function (err, result) {
        if (err) {
            throw err;
        } else {
            obj = { print: result };
            res.render('cus_register.ejs', obj);
        }
    });
});

app.get('/cus_detail', auth, (req, res) => {
    con.query('SELECT * FROM customer_registration ORDER BY Id DESC', function (err, result) {
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
        return res.render('registration_complete.ejs', obj); //changed pointer
    }

    con.query('SELECT * FROM customer_registration WHERE customer_id = ?', [id], function (err, result) {
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

            res.render('registration_complete.ejs', obj); //changed pointer
        }
    });
});

app.post('/print', auth, (req, res) => {
    var id = req.body.ids;
    var type = req.body.type;
    var date = new Date();
    var time = dateFormat(date, "yyyy-mm-dd");

    con.query(`UPDATE customer_registration SET Time = '${time}', Status = 'unpaid' WHERE Id = ?`, [id], function (err, result) {
        if (err) {
            throw err;
        } else {
            res.redirect('/print/' + id);
        }
    });
});

// Route to render documents.ejs
app.get('/documents', (req, res) => {
  res.render('documents.ejs'); // Assuming your EJS file is named documents.ejs
});

app.get("/cus_view", auth, (req, res) => {
  if (req.query.search) {
    const searchKeyword = req.query.search;

    con.query(
      'SELECT customer_id, customer_name, customer_contact, customer_address, loan_type, DATE_FORMAT(date, "%d-%m-%Y") AS formatted_date, image_path, customer_security, security_price FROM customer_registration WHERE customer_name LIKE ?',

      [`%${searchKeyword}%`],
      function (err, result) {
        if (err) {
          throw err;
        } else {
          var obj2 = { print: result };
          res.render('cus_view.ejs', obj2);
        }
      }
    );
  } else {
    con.query(
      'SELECT customer_id, customer_name, customer_contact, customer_address, loan_type, DATE_FORMAT(date, "%d-%m-%Y") AS formatted_date, image_path, customer_security, security_price FROM customer_registration',
      function (err, result) {
        if (err) {
          throw err;
        } else {
          var obj2 = { print: result };
          res.render('cus_view.ejs', obj2);
        }
      }
    );
  }
});



// sending data from database to customer edit form
app.get('/action/:id', auth, function (req, res) {
   
    //console.log(req.params.id);
    let editId = req.params.id;
    if(req.params.id)
    {
        var customerEdit = {};
       // var dropdown = {};
        con.query(`SELECT * FROM customer WHERE customer_id = ${editId}`, function (err, result) {

            if (err) {
                throw err;
            } else {
                
                // customerEdit = results;
                
                customerEdit = { print: result }; 
                //console.log(result);
                
                //console.log(customerEdit.print[0].customer_name);

                res.render('action.ejs', customerEdit)      

            }
        })
        
       

    }
})

// sending data from edit form to database
// edit customer info
app.post('/action', auth, (req, res) => {
    // sending all data as object
   
    
      // console.log(req.params.id);
    //var date = dateFormat(new Date(), "yyyy-mm-dd h:MM:ss");
        var id  = req.body.id;
        var name  = req.body.name;
        var contact  =  req.body.contact;
          var address = req.body.address;
        //  var asset =  req.body.asset;
        // var asset_price =  req.body.p_asset;
       // "type": req.body.type,
        
    
    con.query(`UPDATE customer SET customer_name= '${name}', customer_contact = '${contact}', customer_address = '${address}'  WHERE customer_id = ${id}`, function (error, results) {
        if (error) throw error;
        res.redirect("/cus_view")
    })
})

// deleting customer record

app.get('/delete/:id', auth, (req, res) => {
    // sending all data as object

    var did = req.params.id;
   // console.log(did);
    
    con.query(`delete from customer where customer_id = ${did}`, function (error, results) {
        if (error) 
        {
            throw error;
        } 
        else{
            // window.alert("Deleted Successfully")
            res.redirect("/cus_view")
        }
        
        
    })
})

// customer view info
app.get('/info/:sid/:cid', auth,(req,res)=>{
    let cusID = req.params.cid;
    let sid = req.params.sid;
    if (req.params.sid) {
        var loanInfo = {};
        let cusname = {};
        // var dropdown = {};
        con.query(`SELECT * FROM loan_info WHERE customer_id = ${cusID}`, function (err, result) {

            if (err) {
                throw err;
            } else {
                    // console.log(result[0].name);
                    
                // customerEdit = results;
                // <%=print[0].name%>
                loanInfo = { print: result };
                //  console.log(result);
                 res.render('cus_loan_view.ejs', loanInfo)
             
            }
        })

    }
})
// get customer name


// send data from database to the table of view_loan
app.get("/view_loan", auth, (req, res) => {
    var obj3 = {};
    var customer = {};

    con.query('SELECT customer.customer_id, customer.customer_name, type.type_id, type.name, type.amount, type.no_installment, loan_info.remaining_amount, loan_info.installment_remaining, loan_info.installment_amount, loan_info.date FROM ((type INNER JOIN customer ON type.type_id = customer.customer_registration) INNER JOIN loan_info ON customer.customer_id = loan_info.customer_id)', function (err, result) {
        if (err) {
            throw err;
        } else {
            obj3 = { print: result };
            res.render('view_loan.ejs', obj3);
        }
    });
});



//render installment module
app.get('/installment', auth,function (req,res) {
    res.render('installment.ejs',{print : "hey"});
    
})

// installment taking from html form
app.post('/installment', auth,function (req,res) {
    
    var cusID = req.body.ID ;
    var time = req.body.time;
    var amount = req.body.amount;
    
    
   
//    update loan information after installment
    con.query(`SELECT * FROM loan_info WHERE customer_id = ${cusID}`,function (error, results, fields) {
        if (error)
        {
            throw res.send(error)
        }
        else{
            
            // updating remaining amount
            // console.log(results[0].customer_id);
            var remaining = 0;
            var cus_amount = results[0].remaining_amount;
            var installment_amount = req.body.amount;
            var remaining = Math.round(cus_amount - installment_amount);
            // console.log(remaining);
            // updating installment no
           
            var remaining_install = results[0].installment_remaining;
            remaining_install = remaining_install -1;
             if(remaining > 0)
             {
                 var status = "On Time";
             }
             
            //  finding installment no
            let install_no  = (results[0].installment_no) - (results[0].installment_remaining);

           // console.log(results[0].installment_no);
            
            
            install_no = install_no+1;
           //  console.log(install_no);
           //  console.log(cusID);
            
            //  compring time 
        con.query(`SELECT * FROM customer_registration WHERE install_no = ${install_no} and customer_id = ${cusID}`, function (error, results, fields) {
                if (error) {
                    throw res.send(error)
                }
                else{
                    var date1 = new Date(results[0].Time);
                    var date2 = new Date(req.body.time); 
                    var schedule_date = new Date(results[0].Time);
                    schedule_date = schedule_date.toISOString().slice(0, 10)
                    
                    
                  
               var  tim2 =    date2.toISOString().slice(0, 7)
                 var   tim  =  date1.toISOString().slice(0, 7);
                // console.log(tim);
                // console.log(tim2);
                
                    
                    if(results[0].Time < time)
                    {
                        if(tim2 > tim && remaining_install > 1 ){
                            status  = "Delayed";
                            var amount1 = req.body.amount;
                            var fine  = Math.round((amount1*2)/100);
                            amount = Math.round(amount*1)+(amount**1);
                            remaining_install = remaining_install - 1;
                            remaining = Math.round(cus_amount - amount);
                        }else{
                            status = "Late";
                           fine = 50;
                        }
                
                        
                        //  show an alert
                    }
                    else{
                       fine  = 0;
                    }
                }
            const data = {
                "customer_id": req.body.ID,
                "amount": amount,
                "remaining": remaining,
                "status": status,
                "fine": fine,
                ins_date: req.body.time,
                schedule_date: schedule_date
            }
            con.query('INSERT INTO installment SET ?', data, function (error, results, fields) {
                if (error) throw res.send(error);
                 
            })
            // updating the schedule status
            if (status == "Delayed" && remaining_install > 0) {
                var loop = 2;
            }
            else {
                var loop = 1;
            }
           // console.log(loop);
            
            for (var i = 1; i <= loop; i++) {
                con.query(`UPDATE customer_registratio  SET status = 'paid' WHERE customer_id = '${cusID}' AND install_no = '${install_no}'`, function (error, results) {
                    if (error) throw res.send(error);
                    
                })
                install_no++;

            }

            con.query(`UPDATE loan_info SET remaining_amount= '${remaining}', installment_remaining= '${remaining_install}'  WHERE customer_id = ${cusID}`, function (error, results) {
                if (error) throw  res.send(error);
               res.redirect("/invoice/ " + cusID);
            })
                
          


        }) 
        }
    })

    
})

// generate invoice
app.get('/invoice/:id', auth, (req, res) => {
    // sending all data as object

    var did = req.params.id;
   // console.log(did);
    
    // console.log(did);
     var invoice ={};
    con.query(`SELECT  customer.customer_id,customer.customer_name,customer.customer_address,customer.customer_contact,customer.type_name,customer.type_amount,customer.type_id,customer.installment_amount,customer.img,installment.install_id,installment.amount,installment.remaining,installment.status,installment.fine,customer.date,installment.ins_date,installment.schedule_date FROM customer INNER JOIN installment ON customer.customer_id = installment.customer_id  where customer.customer_id = ${did}`, function (error, result) {
        if (error) {
            throw error;
        }
        else { 
          // console.log(result);
           
            
             invoice = { print: result };
            //  console.log(result);
             
         
            res.render('invoice.ejs', invoice)
        }


    })
})

//installments pay from loan page
app.get('/installment2/:id', auth, function (req, res) {

    // console.log(req.params.id);
    let Id = req.params.id;
    if (req.params.id) {
         
        con.query(`SELECT * FROM loan_info WHERE customer_id = ${Id}`, function (error, result) {

            if (error) {
                throw error;
            } else {

                // customerEdit = results;
                //console.log(result[0].RowDataPacket); 
                typeEdit = { print: result };
                //console.log(customerEdit.print[0].customer_name);

                res.render('installment.ejs', typeEdit);

            }
        })

    }
})
// search option

app.post('/search', auth, function (req, res) {
    var id = req.body.search;
    //console.log(did);
    res.redirect("/search/ " + id);

})

app.get('/search/:id', function (req, res) {
    var id = req.params.id;
    //console.log(id);
    con.query(`select * from customer where customer_id = ${id}`,function (error,results) {
        if(error) 
        {
            res.send(error)
        }
        else{
            
            obj2 = { print: results };
            res.render('search.ejs', obj2);
        }
        
    })
    
})
// loan_info serch option
app.post('/search2', function (req, res) {
    var id = req.body.search;
    //console.log(did);
    res.redirect("/loan_search/ " + id);

})
app.get('/loan_search/:id', function (req, res) {
    var id = req.params.id;
    //console.log(id);
    con.query(`SELECT customer.customer_id, customer.customer_name, customer.type_id, customer.type_name, customer.type_amount, loan_info.installment_no, loan_info.remaining_amount, loan_info.installment_remaining,loan_info.installment_amount,loan_info.date FROM customer INNER JOIN loan_info ON customer.customer_id = loan_info.customer_id where customer.customer_id = ${id}`, function (error, results) {
        if (error) {
            res.send(error)
        }
        else {

            obj2 = { print: results };
            res.render('loan_search.ejs', obj2);
        }

    })

})
//profile of the customer
app.get('/profile/:id',function (req,res) {
     var id  = req.params.id;
     //console.log(id);
     
    con.query(`SELECT t.customer_id,t.customer_name,t.customer_contact,t.customer_address,t.customer_security,t.security_price,t.date,t.type_id,t.type_name,t.type_amount,t.installment_amount,t.date,t.img, tr.Time FROM customer t, customer_registration tr WHERE t.customer_id = tr.customer_id AND tr.customer_id  =  ${id}`, function (err, result) {

        if (err) {
            res.send(err);
        } else {
          
            cusInfo = { print: result };
            //  console.log(result);
            
            
            res.render('profile.ejs', cusInfo);

        }
    })
    
});

// forgot password
app.get('/forgot', (req, res) => {
    res.render('forgot.ejs')

})
app.post('/forgot', (req, res) => {
    
    var father = req.body.father;
    var like = req.body.like;
   
    con.query(`select pass from users where father_name = '${father}' and likee  = '${like}'`, function (error, results) {
        if (error){
            res.send(error);
        }
        var pass = results[0].pass;
        res.send("Your Password was " +pass)
    })
})

// header
// app.get('/header',(req,res)=>{
//     res.render('header.ejs');
// });
// generate pdf for profile

app.get("/generateReport/:id",auth, (req, res) => {
 var id  = req.params.id;

 
    con.query(`SELECT t.customer_id,t.customer_name,t.customer_contact,t.customer_address,t.customer_security,t.security_price,t.date,t.type_id,t.type_name,t.type_amount,t.installment_amount,t.date,t.img, tr.Time FROM customer t, customer_registration tr WHERE t.customer_id = tr.customer_id AND tr.customer_id=  ${id}`, function (err, result) {

        if (err) {
            res.send(err);
        } else {
            var cus  = result[0].customer_name;
            var customer_id = result[0].customer_id;
          let  print = { print: result };

      
            ejs.renderFile(path.join(__dirname, './views/', "profile_pdf.ejs"), print, (err, data) => {
        if (err) {
            res.send(err);
        } else {
            let options = {
                "height": "11.25in",
                "width": "8.5in",
                "header": {
                    "height": "20mm"
                },
                "footer": {
                    "height": "20mm",
                },
            };
            pdf.create(data, options).toFile(`./pdf/${cus}_${customer_id}.pdf`, function (err, data) {
                if (err) {
                    res.send(err);
                } else {
                    res.redirect("/pdf/" + `${cus}_${customer_id}.pdf`);

                }
            });
        }
    });
        }
    })
})
// generate pdf for invoice
app.get("/generateReport_invoice/:id",auth, (req, res) => {
    var id = req.params.id;

    con.query(`SELECT  customer.customer_id,customer.customer_name,customer.customer_address,customer.customer_contact,customer.type_name,customer.type_amount,customer.type_id,customer.installment_amount,customer.img,installment.install_id,installment.amount,installment.remaining,installment.status,installment.fine,customer.date,installment.ins_date,installment.schedule_date FROM customer INNER JOIN installment ON customer.customer_id = installment.customer_id  where customer.customer_id = ${id}`, function (error, result) {
        if (error) {
            throw error;
        }
        else {
            
            var cus = result[0].customer_name;
            var customer_id = result[0].customer_id;
            let print = { print: result };
   
            ejs.renderFile(path.join(__dirname, './views/', "invoice_pdf.ejs"), print, (err, data) => {
                if (err) {
                    res.send(err);
                } else {
                    let options = {
                        "height": "11.25in",
                        "width": "8.5in",
                        "header": {
                            "height": "20mm"
                        },
                        "footer": {
                            "height": "20mm",
                        },
                    };
                    pdf.create(data, options).toFile(`./pdf/${cus}_${customer_id}.pdf`, function (err, data) {
                        if (err) {
                            res.send(err);
                        } else {
                            res.redirect("/pdf/" + `${cus}_${customer_id}.pdf` )
                        }
                    });
                }
            });
        }
    })
})
// sending pdf to browser

app.get('/pdf/:name', function (req, res) {
    var name = req.params.name;
    res.sendFile(__dirname + `/pdf/${name}`);
})

// today installments
app.get('/today',(req,res)=>{

    // let today = dateFormat(new Date(), "yyyy-mm-dd")
    var today = new Date((new Date()).getTime())
   today =  today.toISOString().slice(0, 10);
 
    //console.log(today);
    
    con.query(`SELECT * from customer_registration WHERE Time = '${today}' AND status = 'unpaid'`, function (error, results) {
        if (error) {
            res.send(error)
        }
        else {
           // console.log(results);
            
            obj2 = { print: results };
            res.render('today.ejs', obj2);
        }

    })

});




app.listen( process.env.port || 3000);


/** 
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
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); **/
