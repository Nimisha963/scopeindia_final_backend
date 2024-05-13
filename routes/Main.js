const router = require('express').Router();
const UserModel = require('../model/User');
const productUpload = require('../middlewares/User');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt')
const jwt = require("jsonwebtoken")
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'nimishaanns96@gmail.com',
        pass: process.env.MAIL_PASS
    }
});

router.post('/checkUser', async (req, res) => {
    try {
        const existingUser = await UserModel.findOne({ email: req.body.email });
        res.status(200).json({ exists: !!existingUser });
    } catch (error) {
        console.error('Error checking user:', error);
        res.status(500).json({ exists: false }); // Handle error
    }
});

router.post('/register', productUpload.single('avatar'), async (req, res) => {
    try {
        const existingUser = await UserModel.findOne({ email: req.body.email });
        if (existingUser) {
            res.status(400).json({
                status: false,
                message: 'User already registered'
            });
        }
        else {
            const newUser = await UserModel.create({
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                email: req.body.email,
                password: req.body.password,
                gender: req.body.gender,
                dob: req.body.dob,
                phone: req.body.phone,
                country: req.body.country,
                state: req.body.state,
                city: req.body.city,
                hobbies: req.body.hobbies,
                avatar: '/public/scope' + req.file.filename,
                isFirstTime: req.body.isFirstTime
            });

            res.status(200).json({
                status: true,
                message: 'User successfully registered'
            });
            // Send email only if user is successfully registered
            const mailOptionsHtml = {
                from: 'nimishaanns96@gmail.com',
                to: req.body.email,
                subject: 'Confirmation mail from SCOPE INDIA',
                html: '<h1>Confirmation mail from SCOPE INDIA</h1><p>You have successfully registered in SCOPE INDIA.</p>'
            };

            transporter.sendMail(mailOptionsHtml, function (err, info) {
                if (err) {
                    console.log('Error sending email:', err);
                    res.status(500).json({
                        status: false,
                        message: 'Error sending email'
                    })
                } else {
                    console.log('Email sent successfully');
                    console.log(info)
                }
            });
        }
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({
            status: false,
            message: 'Some error occurred during registration'
        });
    }
});

router.post('/loginfirst', async (req, res) => {
    let email = req.body.email;
    try {
        const existing = await UserModel.findOne({ email: email, isFirstTime: true }, { firstName: 1, dob: 1, _id: 0 });

        console.log(existing);

        if (existing) {
            res.status(200).json({
                status: true,
                message: 'Check your email to get the temporary password'
            });
            let firstName = existing.firstName;
            let dob = existing.dob;
            let year = new Date(dob).getFullYear();
            let password = firstName + '@' + year
            console.log('Email:', email);
            console.log('First Name:', firstName);
            console.log('DOB:', dob);
            console.log('Year:', year);
            console.log('Password:', password);
            var mailOptionsHtml = {
                from: 'nimishaanns96@gmail.com',
                to: email,
                subject: 'First time log in user',
                html: `<h1>Hey ${firstName}. Welcome onboard for the first time  </h1> <p>Here is your temporary password : ${firstName + '@' + year} </p>`

            }

            transporter.sendMail(mailOptionsHtml, function (err, info) {
                if (err) {
                    console.error('Error sending email:', err);
                } else {
                    console.log('Email sent successfully');
                    console.log(info)

                }
            });
            await UserModel.updateOne({ email: email }, { $set: { password: password } })
            console.log("Updated temp password in database");
        }

        if (!existing) {
            return res.status(404).json({
                status: false,
                message: 'User Not found'
            });
        }

    } catch (error) {
        console.log(error)
        res.status(500).json({
            status: false,
            message: 'Some error occurred in handling first time log in'
        })
    }
})

router.post('/temppassword', async (req, res) => {
    temppassword = req.body.temppassword
    firstName = req.body.firstName
    let dob = req.body.dob;
    let year = new Date(dob).getFullYear();
    if (temppassword === firstName + '@' + year) {
        res.status(200).json({
            status: true,
            message: 'Password matches'
        })
    } else {
        res.status(404).json({
            status: false,
            message: 'Password does not match'
        })

    }
})

router.post('/changepasswordfirst', async (req, res) => {
    let passwordfirst = req.body.passwordfirst
    let hashpasswordfirst = await bcrypt.hash(passwordfirst, 10)
    let email = req.body.email
    console.log(email)
    console.log(passwordfirst)
    try {
        const exist = await UserModel.findOne({ email: email })
        if (exist) {
            const firsttime = await UserModel.findOne({ email: email, isFirstTime: true })
            if (firsttime) {
                await UserModel.updateOne({ email: email }, { $set: { password: hashpasswordfirst, isFirstTime: false } })
                console.log("Updated new password and isFirstTime (false) in database")
                res.status(200).json({
                    status: true,
                    message: 'Password successfully changed'
                })
            } else {
                res.status(404).json({
                    status: false,
                    message: 'You are not a first time login user'
                })
            }
        } else {
            res.status(404).json({
                status: false,
                message: 'You are not a Registered user. Please register.'
            })
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({
            status: false,
            message: 'Something went wrong'
        })
    }
})
router.post('/login', async (req, res) => {
    email = req.body.email
    password = req.body.password
    signedin = req.body.signedin
    try {
        result = await UserModel.findOne({ email: email })
        if (result) {
            const dob = result.dob.toISOString().split('T')[0]
            console.log(dob)
            console.log("Loggedin:", result.email)
            // Split the hobbies string into individual hobbies
            const hobbies = result.hobbies[0].split(',').map(hobby => hobby.trim());
            console.log("Hobbies:", hobbies)
            const avatar = result.avatar
            const isFirstTime = result.isFirstTime
            let isPasswordMatched = await bcrypt.compare(password, result.password) //returns true or false
            console.log('LoginIsPasswordMatched:', isPasswordMatched)
            if (isPasswordMatched) {
                let token = jwt.sign({
                    _id: result._id,
                    email: result.email,
                    firstName: result.firstName
                }, process.env.JWT_KEY, {
                    expiresIn: "1d"
                })
                if (signedin) {
                    res.cookie('token', token, { expires: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), httpOnly: true }) //2 days
                    console.log("Signed in true")
                }
                res.status(200).json({
                    status: true,
                    message: 'User successfully logged in',
                    token: token,
                    avatar: avatar,
                    isFirstTime: isFirstTime,
                    email: result.email,
                    firstName: result.firstName,
                    lastName: result.lastName,
                    dob: dob,
                    phone: result.phone,
                    country: result.country,
                    state: result.state,
                    city: result.city,
                    hobbies: hobbies
                })
            } else {
                res.status(404).json({
                    status: false,
                    message: 'Invalid password'
                })
            }
        } else {
            res.status(404).json({
                status: false,
                message: 'Invalid email address'
            })
        }
    }
    catch (error) {
        console.log(error)
        res.status(500).json({
            status: false,
            message: 'An error occurred'
        })
    }
})

router.post('/courses', async (req, res) => {
    let courses = req.body.courses

    // Ensure courses is always an array, even if it's a single object
    if (!Array.isArray(courses)) {
        courses = [courses];
    }
    let email = req.body.email
    console.log(courses)
    try {
        const exist = await UserModel.findOne({ email: email })
        if (exist) {
            const newCourses = courses.filter(course => !exist.courses.some(existingCourse => existingCourse.S1 === course.S1));
            if (newCourses.length > 0) {
                // Use $push operator to add new courses to the existing array
                await UserModel.updateOne({ email: email }, { $push: { courses: { $each: newCourses } } });
                console.log("Courses entered");
                res.status(200).json({
                    status: true,
                    message: 'Courses entered successfully'
                });
            } else {
                res.status(404).json({
                    status: false,
                    message: 'You are already signed up for all the courses'
                });
            }
        } else {
            res.status(404).json({
                status: false,
                message: 'User not found'
            })
        }
    } catch (err) {
        console.log(err)
        res.status(500).json({
            status: false,
            message: 'Something went wrong'
        })
    }
})

router.post('/dashboard', async (req, res) => {
    email = req.body.email
    console.log("Dashboard:", email)
    try {
        const exist = await UserModel.findOne({ email: email }, { courses: 1, _id: 0 })
        console.log("Dashboard:", exist)
        if (exist) {
            res.status(200).json({
                status: true,
                message: 'Successfully found the courses',
                courses: exist.courses,
            })
        } else {
            res.status(404).json({
                status: false,
                message: 'Check your email address'
            })
        }
    } catch (err) {
        console.log(err)
        res.status(500).json({
            status: false,
            message: 'Something went wrong'
        })
    }
})

router.post('/update', productUpload.single('avatar'), async (req, res) => {
    let firstName = req.body.firstName
    let lastName = req.body.lastName
    let email = req.body.email
    let gender = req.body.gender
    let dob = req.body.dob
    let phone = req.body.phone
    let country = req.body.country
    let state = req.body.state
    let city = req.body.city
    let hobbies = req.body.hobbies
    let avatar = '/public/scope' + req.file.filename

    try {
        await UserModel.updateOne({ email: email }, {
            $set: {
                firstName: firstName,
                lastName: lastName,
                gender: gender,
                dob: dob,
                phone: phone,
                country: country,
                state: state,
                city: city,
                hobbies: hobbies,
                avatar: avatar
            }
        })
        console.log("Avatar:", avatar)
        console.log('Profile updated')
        res.status(200).json({
            status: true,
            message: 'Profile updated',
            avatar: avatar
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({
            status: false,
            message: 'Some error occurred'
        })
    }
})

router.post('/changepassword', async (req, res) => {
    let email = req.body.email
    let oldpassword = req.body.oldpassword
    console.log(oldpassword)
    let newpassword = req.body.newpassword
    let newhashpassword = await bcrypt.hash(newpassword, 10)

    try {
        const exist = await UserModel.findOne({ email: email })
        if (exist) {
            let passwordMatch = await bcrypt.compare(oldpassword, exist.password)
            if (passwordMatch) {
                await UserModel.updateOne({ email: email }, { $set: { password: newhashpassword } })

                res.status(200).json({
                    status: true,
                    message: 'Password updated successfully'
                })
            } else {
                res.status(404).json({
                    status: false,
                    message: 'Check the existing password'
                })
            }
        }
    } catch (error) {
        res.status(500).json({
            status: false,
            message: 'Something went wrong'
        })
    }
})

router.post('/forgotpassword', async (req, res) => {
    email = req.body.email

    try {
        const exist = await UserModel.findOne({ email: email })
        if (exist) {
            var mailOptionsHtml = {
                from: 'nimishaanns96@gmail.com',
                to: req.body.email,
                subject: 'OTP',
                html: `<h1> Welcome to SCOPE INDIA </h1> <h2>Forgot your password !!! </h2> No problem, Here is your OTP : ${otp = Math.floor(Math.random() * (9999 - 1000) + 1000)}`
            }
            transporter.sendMail(mailOptionsHtml, function (err, info) {
                if (err) {
                    console.log(err)
                    res.status(404).json({
                        status: false,
                        message: "Something went wrong while sending OTP"
                    })
                } else {
                    console.log(info)
                    console.log('OTP sent successfully')
                    res.status(200).json({
                        status: true,
                        message: "OTP sent successfully",
                        otp: otp
                    })
                }
            })
        } else {
            res.status(404).json({
                status: false,
                message: "Invalid email address",
            })
        }
    } catch (error) {
        res.status(500).json({
            status: false,
            message: 'Something went wrong'
        })
    }
})
router.post('/forgotpasswordsubmitotp', async (req, res) => {
    otp = String(req.body.otp)
    userotp = String(req.body.userotp)
    console.log('Password:', otp, typeof otp, userotp, typeof userotp)
    try {
        if (otp === userotp) {
            res.status(200).json({
                status: 'true',
                message: 'OTP matches'
            })
        } else {
            res.status(404).json({
                status: false,
                message: 'Invalid OTP'
            })
        }
    } catch (err) {
        res.status(500).json({
            status: false,
            message: 'Something went wrong'
        })

    }
})
router.post('/forgotpasswordsubmit', async (req, res) => {
    let email = req.body.email
    let password = req.body.password
    console.log("Forgotpassword:" + password)
    let hashpassword = await bcrypt.hash(password, 10)


    try {
        const exist = await UserModel.findOne({ email: email })
        if (exist) {
            await UserModel.updateOne({ email: email }, { $set: { password: hashpassword } })
            res.status(200).json({
                status: true,
                message: 'Password updated successfully'
            })
        } else {
            res.status(404).json({
                status: false,
                message: 'User not found'
            })
        }
    } catch (error) {
        res.status(500).json({
            status: false,
            message: 'Something went wrong when updating the password'
        })
    }
})

router.post('/contact', async (req, res) => {
    let name = req.body.name
    let email = req.body.email
    let subject = req.body.subject
    let message = req.body.message
    try {
        var mailOptionsHtml = {
            to: 'nimishaanns96@gmail.com',
            subject: subject,
            html: `<h4>Name:</h4> ${name}    
<h4>Message:</h4> ${message}
<h4>Email_Id:</h4> ${email}`
        }
        transporter.sendMail(mailOptionsHtml, function (err, info) {
            if (err) {
                console.log(err)
                res.status(401).json({
                    status: false,
                    message: 'Something went wrong while sending email'
                })
            } else {
                console.log('Email sent successfully')
                res.status(200).json({
                    status: true,
                    message: `Hi ${name}, Email sent successfully. We will contact you soon`
                })
            }
        })
    } catch (error) {
        console.log('ContactUs:', error)
        res.status(500).json({
            status: false,
            message: 'Something went wrong'
        })
    }
})

router.post('/logout', async (req, res) => {
    try {
        res.clearCookie('token')
        console.log('Cleared the cookies')
        res.status(200).json({
            status: true,
            message: 'Logged out successfully'
        })
    } catch (err) {
        res.status(500).json({
            status: false,
            message: 'Something went wrong'
        })
    }
})
module.exports = router;