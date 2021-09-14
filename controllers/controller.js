const bcrypt = require("bcrypt");
const mysql = require("mysql");
const fs = require("fs");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "mydatabase",
});

module.exports.getCategories = (req, res) => {
  var sql =
    "SELECT * FROM `categories` ORDER BY `categories`.`no_of_views` ASC";
  db.query(sql, function (err, result) {
    if (err) throw err;
    let categories = [];
    result.map((category) => {
      categories.push(category.category);
    });
    res.status(200).json({ categories });
  });
};

module.exports.postSignup = async (req, res) => {
  let fullname = req.body.fullname;
  let email = req.body.email;
  let password = req.body.password;
  let confirmPassword = req.body.confirmPassword;
  if (password !== confirmPassword) {
    res.redirect("http://localhost:3000/");
    return;
  }
  let salt = await bcrypt.genSalt();
  password = await bcrypt.hash(password, salt);
  var sql = "INSERT INTO user (user_name, user_email, password) VALUES (?,?,?)";
  db.query(sql, [fullname, email, password], function (err, result) {
    if (err) {
      res.redirect("http://localhost:3000/");
    } else {
      fullname = fullname.split(" ").join("");
      res.redirect(
        `http://localhost:3000/?username=${fullname}&userid=${result.insertId}`
      );
      res.status(200);
    }
  });
};

module.exports.postLogin = (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  var sql = `SELECT * FROM user WHERE user_email = '${email}'`;
  db.query(sql, async function (err, result) {
    if (err) {
      //console.log(err.message)
      res.redirect("http://localhost:3000/");
    } else {
      //console.log(result)
      let status = await bcrypt.compare(password, result[0].password);
      if (status) {
        fullname = result[0].user_name.split(" ").join("");
        res.redirect(
          `http://localhost:3000/?username=${fullname}&userid=${result[0].user_id}`
        );
        res.status(200);
      } else {
        res.redirect("http://localhost:3000/");
      }
    }
  });
};

module.exports.postVideo = (req, res) => {
  const { title, quality, description, userid: user_id } = req.body;
  let category = req.body.category;
  console.log(category);
  const upload_date = Date().split(" ").slice(1, 4).join(" ");
  //console.log(req.body);
  //console.log(req.files)

  var sql = `INSERT INTO video(title, view_count, thumbnail_path, likes, upload_date, quality, captions, dislikes, user_id, description, video_path)
            VALUES ('${title}', 0, '/public/thumbnails/${req.files[1].originalname}', 0, '${upload_date}', '${quality}', ' ', 0, ${user_id}, '${description}', '/public/${req.files[0].originalname.split(".")[1] == "mp3" ? "audios" : "videos"}/${req.files[0].originalname}')`;

  db.query(sql, function (err, result) {
    if (err) {
      console.log(err.message);
      res.redirect("http://localhost:3000/");
    } else {
      //console.log(result)
      if (typeof category == "object") {
        category.forEach((val, index) => {
          var sql = `INSERT INTO video_category(title, category) VALUES('${title}', '${val}')`;
          db.query(sql, function (err, result) {
            if (err) {
              console.log(err.message);
            } else {
              console.log(result);
            }
          });
        });
      } else {
        var sql = `INSERT INTO video_category(title, category) VALUES('${title}', '${category}')`;
        db.query(sql, function (err, result) {
          if (err) {
            console.log(err.message);
          } else {
            console.log(result);
          }
        });
      }
      res.redirect("http://localhost:3000/");
    }
  });
};

module.exports.postUserVideos = (req, res) => {
  const user_id = req.body.userid;
  var sql = `SELECT * FROM video WHERE user_id = ${user_id}`;
  db.query(sql, (err, result) => {
    if (err) {
      res.status(404).json({ status: "No Videos Found!" });
    } else {
      //console.log(result)
      var sql = `SELECT * FROM playlist WHERE user_id = ${user_id}`;
      db.query(sql, (err, result2) => {
        if (err) console.log(err);
        else {
          result2.forEach((val, index) => {
            var sql = `SELECT * FROM playlist_videos WHERE name = '${val.name}'`;
            db.query(sql, (err, result3) => {
              if (err) console.log(err);
              else {
                val.videos = result3;
              }
            });
          });
          setTimeout(() => {
            console.log(result2);
            res.status(200).json({ result, playlist: result2 });
          }, 1000);
        }
      });
    }
  });
};

module.exports.getAllVideos = (req, res) => {
  var sql = `SELECT * FROM video`;
  db.query(sql, (err, result) => {
    if (err) {
      res.status(404).json({ status: "No Videos Found!" });
    } else {
      //console.log(result)
      var sql = `SELECT * FROM video_category`;
      db.query(sql, (err, result2) => {
        if (err) {
          console.log(err);
        } else {
          result = result.map((val, index) => {
            result2.forEach((val2, index2) => {
              if (val.title == val2.title) {
                if (typeof val.category != "object") {
                  val.category = [];
                  val.category.push(val2.category);
                } else {
                  val.category.push(val2.category);
                }
              }
            });
            return val;
          });
          res.status(200).json({ result });
        }
      });
    }
  });
};

module.exports.showVideo = (req, res) => {
  const title = req.query.title;
  var sql = `SELECT * FROM video WHERE title = '${title}'`;
  db.query(sql, (err, result) => {
    if (err) {
      res.status(404).json({ status: "No Videos Found!" });
    } else {
      var sql = `SELECT * FROM video_category`;
      db.query(sql, (err, result2) => {
        if (err) {
          console.log(err);
        } else {
          result = result.map((val, index) => {
            result2.forEach((val2, index2) => {
              if (val.title == val2.title) {
                if (typeof val.category != "object") {
                  val.category = [];
                  val.category.push(val2.category);
                } else {
                  val.category.push(val2.category);
                }
              }
            });
            return val;
          });
          res.status(200).json({ result });
        }
      });
    }
  });
};

module.exports.filterVideos = (req, res) => {
  let query = req.query.query;
  let categoryQuery = req.query.category;

  var sql;

  sql = `SELECT * FROM video`;
  db.query(sql, (err, result) => {
    if (err) {
      res.status(404).json({ status: "No Videos Found!" });
    } else {
      if (query) {
        result = result.filter((val, index) => {
          if (val.title.toLowerCase().includes(query.toLowerCase())) {
            return val;
          }
        });
        res.status(200).json({ result });
      } else {
        console.log("Else");
        var categorySQL = `SELECT * FROM video_category`;
        db.query(categorySQL, (err, result2) => {
          categoryResult = result2.filter((val, index) => {
            //console.log(val);
            if (val.category.toLowerCase() == categoryQuery.toLowerCase()) {
              return val;
            }
          });
          categoryVideos = [];
          categoryResult.forEach((val) => {
            result.forEach((v) => {
              if (v.title === val.title) {
                categoryVideos.push(v);
              }
            });
          });
          console.log(categoryVideos);
          res.status(200).json({ result: categoryVideos });
        });
      }
    }
  });
};

module.exports.getUser = (req, res) => {
  let userid = req.query.userid;
  var sql = `SELECT * FROM user where user_id = ${userid}`;
  db.query(sql, (err, user) => {
    if (err) {
      res.status(404).json({ status: "No User Found!" });
    } else {
      // console.log(user)
      res.status(200).json({ user });
    }
  });
};

module.exports.postPlaylist = (req, res) => {
  console.log(req.body);
  console.log(req.query);
  var sqlForPlaylistVideos = `INSERT INTO playlist_videos(name, title) VALUES('${req.body.playlistname}', '${req.query.title}')`;
  var count = 0;

  var sqlForLength = `SELECT COUNT(name) FROM playlist_videos WHERE name = '${req.body.playlistname}'`;
  db.query(sqlForLength, (err, data) => {
    if (err) {
      console.log(err);
      res.status(404).json({ status: "No User Found!" });
    } else {
      let result = JSON.parse(JSON.stringify(data))[0];
      count = result["COUNT(name)"];
      if (count == 0) {
        var sql = `INSERT INTO playlist(name, no_of_videos, total_views, user_id) VALUES('${req.body.playlistname}', 1, 0, ${req.query.userid})`;
        db.query(sql, (err, user) => {
          if (err) {
            res.json(err);
          } else {
            console.log(user);
            // res.redirect("http://localhost:3000/");
          }
        });
      }

      db.query(sqlForPlaylistVideos, (err, user) => {
        if (err) {
          console.log(err);
          res.redirect("http://localhost:3000/");
        } else {
          var sql = `UPDATE playlist SET no_of_videos = ${
            count + 1
          } WHERE name = '${req.body.playlistname}'`;
          db.query(sql, (err, result) => {
            if (err) console.log(err);
            else {
              res.redirect("http://localhost:3000/");
            }
          });
        }
      });
    }
  });
};

module.exports.postComment = (req, res) => {
  const { comment_text, time, user_id, title } = req.body.comment;
  let sql = `INSERT INTO comments(likes, time, user_id, comment_text, title) 
  VALUES(0, '${time}', ${user_id}, '${comment_text}', '${title}')`;
  db.query(sql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.json({ result });
    }
  });
};

module.exports.getComments = (req, res) => {
  const { title } = req.query;
  var sql = `SELECT * FROM comments WHERE title = '${title}'`;
  db.query(sql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.json({ result });
    }
  });
};

module.exports.putLikeDislike = (req, res) => {
  console.log(req.body);
  const { likes, dislikes, title } = req.body;
  var sql = `UPDATE video SET likes = ${likes}, dislikes = ${dislikes} WHERE title = '${title}'`;
  db.query(sql, (err, result) => {
    if (err) console.log(err);
    else {
      res.json({ likes, dislikes }).status(200);
    }
  });
};

module.exports.putViews = (req, res) => {
  const { views, title } = req.body;
  var sql = `UPDATE video SET view_count = ${views} WHERE title = '${title}'`;
  db.query(sql, (err, result) => {
    if (err) console.log(err);
    else {
      res.json({ views }).status(200);
    }
  });
};

module.exports.removefromplaylist = (req, res) => {
  let title = req.query.title;
  let name = req.query.name;
  let num = Number(req.query.num);
  console.log(req.query);
  var deleteSQL = `DELETE FROM playlist_videos WHERE name = '${name}' AND title = '${title}'`;
  db.query(deleteSQL, (err, result) => {
    if (err) console.log(err);
    else {
      console.log(result);
      if (num != 1) {
        let updateSQL = `UPDATE playlist SET no_of_videos = ${
          num - 1
        } WHERE name = '${name}'`;
        db.query(updateSQL, (err, result) => {
          if (err) console.log(err);
          else {
            res.json({ result }).status(200);
          }
        });
      }else{
        let deleteSQL = `DELETE FROM playlist WHERE name = '${name}'`;
        db.query(deleteSQL, (err, result) => {
          if (err) console.log(err);
          else {
            res.json({ result }).status(200);
          }
        });
      }
    }
  });
};
