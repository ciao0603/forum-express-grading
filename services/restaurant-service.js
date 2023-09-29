const { Restaurant, Category } = require('../models')
const { getOffset, getPagination } = require('../helpers/pagination-helper')

const restaurantServices = {
  getRestaurants: (req, callback) => {
    const DEFAULT_LIMIT = 9
    const categoryId = Number(req.query.categoryId) || ''
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || DEFAULT_LIMIT // 供前台客製用
    const offset = getOffset(limit, page)

    return Promise.all([
      Restaurant.findAndCountAll({
        include: Category,
        where: {
          ...categoryId ? { categoryId } : {}
        },
        limit,
        offset,
        nest: true,
        raw: true
      }),
      Category.findAll({ raw: true })
    ])
      .then(([restaurants, categories]) => {
        const favoriteRestaurantsId = req.user?.FavoriteRestaurants ? req.user.FavoriteRestaurants.map(fr => fr.id) : []
        const likeRestaurantsId = req.user?.LikeRestaurants ? req.user.LikeRestaurants.map(lr => lr.id) : []
        const data = restaurants.rows.map(r => ({
          ...r,
          description: r.description.substring(0, 50),
          isFavorite: favoriteRestaurantsId.includes(r.id),
          isLike: likeRestaurantsId.includes(r.id)
        }))

        return callback(null, {
          restaurants: data,
          categories,
          categoryId,
          pagination: getPagination(limit, page, restaurants.count)
        })
      })
      .catch(err => callback(err))
  }
}

module.exports = restaurantServices
