const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
var authenticate = require('../authenticate');
const cors = require('./cors');

const Favorites = require('../models/favorite');
const Dishes = require('../models/dishes');

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    Favorites.find({'user': req.user._id})
    .populate('user')
    .populate('dishes')
    .then((dishes) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(dishes);
    }, (err) => next(err))
    .catch((err) => next(err));
})

.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
  Favorites.findOne({'user': req.user._id})
  .then((favorites) => {
      console.log("fav",favorites);
    if(!favorites) {
      Favorites.create({})
      .then((favorites) => {
        favorites.user = req.user._id;
        favorites.dishes = req.body;
        favorites.save()
        .then((favorite) => {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json(favorite);
        })
        .catch(err => next(err));
      })
      .catch(err => next(err));
    } else {
      for(var i = 0; i < req.body.length; i++) {
       var dishid = req.body[i]._id;
        if(favorites.dishes.indexOf(dishid) === -1) {
          favorites.dishes.push(dishid);
        }
      }
        favorites.user = req.user._id;
        favorites.save()
        .then((favorite) => {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json(favorite);
        })
        .catch(err => next(err));
      
    }
  })
  .catch(err => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({'user': req.user._id})
    .then((dish) => {
        if (dish.user.equals(req.user._id)){
            Favorites.remove({})
                .then((resp) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(resp);
                }, (err) => next(err))
                .catch((err) => next(err)); 
        }
        else{
            res.statusCode = 403;
            res.end('You are not authorized to delete the dish!');
        }
    }, (err) => next(err))
    .catch((err) => next(err));
});

favoriteRouter.route('/:dishId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
   Favorites.findOne({'user': req.user._id})
    .then((dish) => {
        if(dish == null){
            Favorites.create({})
                .then((favorites) => {
                    favorites.user = req.user._id;
                    favorites.dishes.push(req.params.dishId);
                    favorites.save()
                        .then((favorite) => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(favorite);
                        })
                        .catch(err => next(err));
                })
                .catch(err => next(err));
        }
       else if(dish && dish.user.equals(req.user._id)){
               if (dish.dishes.indexOf(req.params.dishId) === -1) {
                   dish.dishes.push(req.params.dishId);
                   dish.save()
                    .then((dish) => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(dish);
                    }, (err) => next(err));
            }  
        }
        else{
            res.statusCode = 200;
            res.end('dishId'
                + req.params.dishId +'already present!'); 
        }
        
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
   res.statusCode = 403;
    res.end('PUT operation not supported on /favorites/'
        + req.params.dishId);
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
     Favorites.findOne({'user': req.user._id})
    .then((dish) => {
        if (dish != null && req.user._id.equals(dish.user)) {
            for (var i = (dish.dishes.length - 1); i >= 0; i--) {
                if(dish.dishes[i].equals(req.params.dishId))
                {
                    dish.dishes.splice(i, 1);
                    // dish.dishes[i].remove();
                }
            }
            dish.save()
            .then((dish) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(dish);                
            }, (err) => next(err));
        }
        else if (dish == null) {
            err = new Error('Dish ' + req.params.dishId + ' not found');
            err.status = 404;
            return next(err);
        }
        else if(!req.user._id.equals(dish.user)){
            var err = new Error('You are not authorized to delete this comment!');
            err.status = 403;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
});

module.exports = favoriteRouter;