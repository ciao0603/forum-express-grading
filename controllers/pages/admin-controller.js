const { Restaurant, User, Category } = require('../../models')
const { imgurFileHandler } = require('../../helpers/file-helpers')
const adminServices = require('../../services/admin-service')

const adminController = {
  getRestaurants: (req, res, next) => {
    adminServices.getRestaurants(req, (err, data) => err ? next(err) : res.render('admin/restaurants', data))
  },
  createRestaurant: (req, res, next) => {
    Category.findAll({
      raw: true
    })
      .then(categories => {
        res.render('admin/create-restaurant', { categories })
      })
      .catch(err => next(err))
  },
  postRestaurant: (req, res, next) => {
    const { name, tel, address, openingHours, description, categoryId } = req.body
    const { file } = req
    if (!name) throw new Error('Restaurant name is required!')
    imgurFileHandler(file) // 此為promise
      .then(filePath => {
        return Restaurant.create({
          name,
          tel,
          address,
          openingHours,
          description,
          image: filePath || null,
          categoryId
        })
      })
      .then(() => {
        req.flash('success_messages', 'Restaurant was successfully created!')
        res.redirect('/admin/restaurants')
      })
      .catch(err => next(err))
  },
  getRestaurant: (req, res, next) => {
    const id = req.params.id
    Restaurant.findByPk(id, {
      raw: true,
      nest: true,
      include: [Category]
    })
      .then(restaurant => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")
        res.render('admin/restaurant', { restaurant })
      })
      .catch(err => next(err))
  },
  editRestaurant: (req, res, next) => {
    const id = req.params.id
    Promise.all([
      Restaurant.findByPk(id, { raw: true }),
      Category.findAll({ raw: true })
    ])
      .then(([restaurant, categories]) => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")
        res.render('admin/edit-restaurant', { restaurant, categories })
      })
      .catch(err => next(err))
  },
  putRestaurant: (req, res, next) => {
    const { name, tel, address, openingHours, description, categoryId } = req.body
    const id = req.params.id
    const { file } = req
    if (!name) throw new Error('Restaurant name is required!')
    Promise.all([
      Restaurant.findByPk(id),
      imgurFileHandler(file)
    ])
      .then(([restaurant, filePath]) => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")

        return restaurant.update({
          name,
          tel,
          address,
          openingHours,
          description,
          image: filePath || restaurant.image,
          categoryId
        })
      })
      .then(() => {
        req.flash('success_messages', 'restaurant was successfully to update')
        res.redirect('/admin/restaurants')
      })
      .catch(err => next(err))
  },
  deleteRestaurant: (req, res, next) => {
    adminServices.deleteRestaurant(req, (err, data) => {
      if (err) return next(err)
      req.session.deletedData = data
      return res.redirect('/admin/restaurants')
    })
  },
  getUsers: (req, res, next) => {
    return User.findAll({
      raw: true
    })
      .then(users => res.render('admin/users', { users }))
      .catch(err => next(err))
  },
  patchUser: (req, res, next) => {
    const id = req.params.id
    return User.findByPk(id)
      .then(user => {
        if (!user) throw new Error("User didn't exist !")
        if (user.email === 'root@example.com') {
          req.flash('error_messages', '禁止變更 root 權限')
          res.redirect('back')
        } else {
          user.update({
            isAdmin: !user.isAdmin
          })
          req.flash('success_messages', '使用者權限變更成功')
          res.redirect('/admin/users')
        }
      })
      .catch(err => next(err))
  },
  getCategories: (req, res, next) => {
    Category.findAll({
      raw: true
    })
      .then(categories => res.render('admin/categories', { categories }))
      .catch(err => next(err))
  }
}

module.exports = adminController
