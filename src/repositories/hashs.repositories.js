import connectionDB from "../database/connectionDB.js";

async function getHashByName(hashName) {
  const { rows } = await connectionDB.query(
    `SELECT * FROM hashs WHERE name = $1;`,
    [hashName]
  );

  return rows;
}

async function getPostsByHashName(hash_name) {
  const { rows } = await connectionDB.query(
    `SELECT
        COALESCE (ARRAY_AGG( JSON_BUILD_OBJECT (
            'user_name',  users2.name,
            'user_id', users2.id
            )) FILTER (WHERE users2.id IS NOT NULL), ARRAY[]::json[]) 
            AS likes,
        (
          SELECT
            COALESCE( JSON_AGG(comments_rows), '[]' )
          FROM (
            SELECT
              c.user_id, c.comment,
              u.name, u.picture_url
            FROM
              comments c
            JOIN
              users u
            ON
              c.user_id = u.id
            WHERE
              post_id = posts.id
          ) AS comments_rows
        ) AS comments,
        posts.id AS post_id,
        posts.description,
        posts.url,
        users.name AS user,
        users.id AS user_id,
        users.picture_url AS "userImage"
      FROM posts
      JOIN users ON posts.user_id = users.id
      LEFT JOIN likes ON posts.id = likes.post_id
      LEFT JOIN hashs ON posts.id=hashs.post_id
      LEFT JOIN users AS users2 ON users2.id = likes.user_id
      WHERE hashs.name=$1
      GROUP BY posts.id, users.name, users.picture_url, users.id
      ORDER BY posts.created_at DESC;`,
    [hash_name]
  );

  return rows;
}

async function getHashtags() {
  const hashtags = await connectionDB.query(
    `
    SELECT
        h.name AS hashtag, h.name, COUNT(h.name) AS count
    FROM
        hashs h
    GROUP BY
        h.name
    ORDER BY
        count DESC
    LIMIT
        10;
    `
  );

  return hashtags.rows;
}

const hashsRepositories = {
  getHashByName,
  getPostsByHashName,
  getHashtags,
};

export default hashsRepositories;
