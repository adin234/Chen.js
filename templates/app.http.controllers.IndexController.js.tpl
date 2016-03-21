'use strict';

class IndexController extends Chen.Controller {

  *index(req, res) {
    return res.render('index');
  }
}

module.exports = IndexController;
