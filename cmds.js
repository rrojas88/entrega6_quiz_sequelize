
const Sequelize = require('sequelize')

const {log, biglog, errorlog, colorize} = require("./out");

//const model = require('./model');
const { models } = require('./model');


/**
 * Muestra la ayuda.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.helpCmd = rl => {
    log("Commandos:");
    log("  h|help - Muestra esta ayuda.");
    log("  list - Listar los quizzes existentes.");
    log("  show <id> - Muestra la pregunta y la respuesta el quiz indicado.");
    log("  add - Añadir un nuevo quiz interactivamente.");
    log("  delete <id> - Borrar el quiz indicado.");
    log("  edit <id> - Editar el quiz indicado.");
    log("  test <id> - Probar el quiz indicado.");
    log("  p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
    log("  credits - Créditos.");
    log("  q|quit - Salir del programa.");
    rl.prompt();
};


/**
 * Lista todos los quizzes existentes en el modelo.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.listCmd = rl => {
    models.quiz.findAll()
    .then( quizzes => {
        quizzes.forEach( q => {
            log(`[${colorize(q.id, 'magenta')}]:  ${q.question}`)
        })
    })
    .catch( err => {
        errorlog( err.message )
    })
    .then(()=>{
        rl.prompt()
    })
    /*model.getAll().forEach((quiz, id) => {
        log(` [${colorize(id, 'magenta')}]:  ${quiz.question}`);
    });
    rl.prompt();*/
};



const validateId = id => {
    return new Promise( (resolve, reject) => {
        if( typeof id === 'undefined' ){
            reject( new Error (`Falta el parametro <id>.`))
        }
        else{
            id = parseInt( id )
            if( Number.isNaN(id) ){
                reject( new Error (`El valor del parámetro <id> No es un numero.`))
            }
            else{
                resolve( id )
            }
        }
    })
}

/**
 * Muestra el quiz indicado en el parámetro: la pregunta y la respuesta.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a mostrar.
 */
exports.showCmd = (rl, id) => {
    validateId( id )
    .then( id => models.quiz.findByPk( id ) )
    .then( quiz => {
        if( ! quiz ){
            throw new Error(`No existe un quiz asociado al id = ${id}.`)
        }
        log(` [${colorize(id, 'magenta')}]:  ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
    })
    .catch( err => {
        errorlog(err.message);
    })
    .then(()=>{
        rl.prompt()
    })
    /*
    if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id.`);
    } else {
        try {
            const quiz = model.getByIndex(id);
            log(` [${colorize(id, 'magenta')}]:  ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
        } catch(error) {
            errorlog(error.message);
        }
    }
    rl.prompt();*/
};




const makeQuestion = (rl, text) => {
    return new Sequelize.Promise((resolve, reject) => {
        rl.question( colorize(text, 'red'), answer => {
            resolve( answer.trim() )
        })
    })
}

exports.addCmd = rl => {
    makeQuestion( rl, ' Introduzca una pregunta: ')
    .then( q => {
        return makeQuestion(rl, ' Introduzca la respuesta ')
        .then( a => {
            return { question: q, answer: a }
        })
    })
    .then( quiz => {
        return models.quiz.create( quiz )
    })
    .then( quiz => {
        log(` ${colorize('Se ha añadido', 'magenta')}: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
    })
    .catch( Sequelize.ValidationError, err => {
        errorlog('El quiz es erroneo');
        err.errors.forEach( ({message}) => errorlog(message) )
    })
    .catch( err => {
        errorlog(err.message);
    })
    .then(()=>{
        rl.prompt()
    })

/*  rl.question(colorize(' Introduzca una pregunta: ', 'red'), question => {

        rl.question(colorize(' Introduzca la respuesta ', 'red'), answer => {

            model.add(question, answer);
            log(` ${colorize('Se ha añadido', 'magenta')}: ${question} ${colorize('=>', 'magenta')} ${answer}`);
            rl.prompt();
        });
    });*/
};


exports.deleteCmd = (rl, id) => {
    validateId( id )
    .then( id => models.quiz.destroy({where: {id} }) )
    .then( quiz => {
        if( ! quiz ){
            throw new Error(`No existe un quiz asociado al id = ${id}.`)
        }
        log(`Borrado ! `);
    })
    .catch( err => {
        errorlog(err.message);
    })
    .then(()=>{
        rl.prompt()
    })

/*    if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id.`);
    } else {
        try {
            model.deleteByIndex(id);
        } catch(error) {
            errorlog(error.message);
        }
    }
    rl.prompt();*/
};


/**
 * Edita un quiz del modelo.
 *
 * Hay que recordar que el funcionamiento de la funcion rl.question es asíncrono.
 * El prompt hay que sacarlo cuando ya se ha terminado la interacción con el usuario,
 * es decir, la llamada a rl.prompt() se debe hacer en la callback de la segunda
 * llamada a rl.question.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a editar en el modelo.
 */
exports.editCmd = (rl, id) => {

    validateId( id )
    .then( id => models.quiz.findByPk( id ) )
    .then( quiz => {
        if( ! quiz ){
            throw new Error(`No existe un quiz asociado al id = ${id}.`)
        }

        process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);
        
        return makeQuestion( rl, ' Introduzca una pregunta: ')
        .then( q => {

            process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);

            return makeQuestion(rl, ' Introduzca la respuesta ')
            .then( a => {
                quiz.question = q, 
                quiz.answer = a
                return quiz
            })
        })
        .then( quiz => {
            return quiz.save()
        })
        .then( quiz => {
            log(` ${colorize('Se ha actualizado', 'magenta')}: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
        })
        .catch( Sequelize.ValidationError, err => {
            errorlog('El quiz es erroneo');
            err.errors.forEach( ({message}) => errorlog(message) )
        })
        .catch( err => {
            errorlog(err.message);
        })
        .then(()=>{
            rl.prompt()
        })

    })

    /*
    if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id.`);
        rl.prompt();
    } else {
        try {
            const quiz = model.getByIndex(id);

            process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);

            rl.question(colorize(' Introduzca una pregunta: ', 'red'), question => {

                process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);

                rl.question(colorize(' Introduzca la respuesta ', 'red'), answer => {
                    model.update(id, question, answer);
                    log(` Se ha cambiado el quiz ${colorize(id, 'magenta')} por: ${question} ${colorize('=>', 'magenta')} ${answer}`);
                    rl.prompt();
                });
            });
        } catch (error) {
            errorlog(error.message);
            rl.prompt();
        }
    }*/
};


/**
 * Prueba un quiz, es decir, hace una pregunta del modelo a la que debemos contestar.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a probar.
 */
exports.testCmd = (rl, id) => {
    validateId( id )
    .then( id => models.quiz.findByPk( id ) )
    .then( quiz => {
        if( ! quiz ){
            throw new Error(`No existe un quiz asociado al id = ${id}.`)
        }

        process.stdout.isTTY && setTimeout(() => {rl.write('')},0);
        
        return makeQuestion( rl, ` ${quiz.question} : `)
        .then( resp => {
            resp = resp+''
            resp = resp.toLowerCase().trim()

            let resp_quiz = quiz.answer.toLowerCase()

            if( resp == resp_quiz ){
                biglog('CORRECTO', 'green');
            }else{
                biglog('INCORRECTO', 'green');
            }
        })
        .catch( err => {
            errorlog(err.message);
        })
        .then(()=>{
            rl.prompt()
        })

    })

};


/**
 * Pregunta todos los quizzes existentes en el modelo en orden aleatorio.
 * Se gana si se contesta a todos satisfactoriamente.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.playCmd = async (rl) => {
    let score = 0
    let toBeResolved = []

    let quizzes = await models.quiz.findAll()
    let cant = quizzes.length
    //console.log( `Cant: ${cant}`)

    const playOne = async () => {

        let id = 0, quiz_valido = false
        id = Math.floor(Math.random() * (cant))

        if( toBeResolved.length == 0 ){
            toBeResolved.push( id )
            quiz_valido = true
        }
        else{
            let exist = true
            while( exist ){
                exist  = false
                id = ( Math.floor(Math.random() * (cant)) ) + 1
                for( i in toBeResolved ){
                    if( toBeResolved[i] == id ) exist = true
                }
                if(  ! exist ) toBeResolved.push( id )
            }
            quiz_valido = ! exist
        }

        //console.log( `ID: ${id}`)
        const quiz = await models.quiz.findByPk(id)
        //console.log( `quiz: ${quiz}`)

        process.stdout.isTTY && setTimeout(() => {rl.write('') }, 0)

        return makeQuestion( rl, ` ${quiz.question} : `)
        .then( resp => {
            resp = resp+''
            resp = resp.toLowerCase().trim()

            let resp_quiz = quiz.answer.toLowerCase()

            if( resp == resp_quiz ){
                score++
                log(`CORRECTO - Lleva ${score} aciertos`, 'green');
                biglog(score, 'green');
                //console.warn('Cant: '+cant+'. TamVector: '+toBeResolved.length+' == score:'+score)
                if( score != cant ){
                    playOne()
                }
                else{
                    biglog('GANASTE', 'green');
                }
            }else{
                log('INCORRECTO\n Fin del juego. Aciertos: '+score, 'red');
                biglog(score, 'red');
                //rl.prompt();
            }
        })
        .catch( err => {
            errorlog(err.message);
        })
        .then(()=>{
            rl.prompt()
        })
/*
        rl.question(colorize(quiz.question, 'red'), resp => {
            resp = resp+''
            resp = resp.toLowerCase().trim()

            let resp_quiz = quiz.answer.toLowerCase()

            if( resp == resp_quiz ){
                score++
                log(`CORRECTO - Lleva ${score} aciertos`, 'green');
                biglog(score, 'green');
                //console.warn('Cant: '+cant+'. TamVector: '+toBeResolved.length+' == score:'+score)
                if( score != cant ){
                    playOne()
                }
                else{
                    biglog('GANASTE', 'green');
                }
            }else{
                log('INCORRECTO\n Fin del juego. Aciertos: '+score, 'red');
                biglog(score, 'red');
                rl.prompt();
            }
        })*/

    }

    playOne()
};


/**
 * Muestra los nombres de los autores de la práctica.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.creditsCmd = rl => {
    log('Autor práctica:');
    log('Robinso', 'green');
    log('Rojas', 'green');
    rl.prompt();
};


/**
 * Terminar el programa.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.quitCmd = rl => {
    rl.close();
};

