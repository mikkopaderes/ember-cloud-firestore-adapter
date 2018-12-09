/**
 * Returns the fixture data
 *
 * @return {Object} Fixture data
 */
export default function getFixtureData() {
  return {
    __collection__: {
      admins: {
        __doc__: {
          user_a: {
            since: 2010,
          },

          user_b: {
            since: 2015,
          },
        },
      },

      posts: {
        __doc__: {
          post_a: {
            title: 'user_a',
            author: '__ref__:users/user_a',
          },

          post_b: {
            title: 'user_b',
            author: '__ref__:users/user_b',
          },

          post_c: {
            title: 'user_a',
            author: '__ref__:users/user_a',
          },
        },
      },

      users: {
        __doc__: {
          user_a: {
            age: 15,
            username: 'user_a',

            __collection__: {
              feeds: {
                __doc__: {
                  post_b: {
                    title: 'user_b',
                    author: '__ref__:users/user_b',
                  },
                },
              },

              friends: {
                __doc__: {
                  user_b: {
                    referenceTo: '__ref__:users/user_b',
                  },

                  user_c: {
                    referenceTo: '__ref__:users/user_c',
                  },
                },
              },
            },
          },

          user_b: {
            age: 10,
            username: 'user_b',

            __collection__: {
              feeds: {
                __doc__: {
                  post_a: {
                    title: 'user_a',
                    author: '__ref__:users/user_a',
                  },

                  post_c: {
                    title: 'user_a',
                    author: '__ref__:users/user_a',
                  },
                },
              },

              friends: {
                __doc__: {
                  user_a: {
                    referenceTo: '__ref__:users/user_a',
                  },
                },
              },
            },
          },

          user_c: {
            age: 20,
            username: 'user_c',

            __collection__: {
              feeds: {
                __doc__: {
                  post_a: {
                    title: 'user_a',
                    author: '__ref__:users/user_a',
                  },

                  post_c: {
                    title: 'user_a',
                    author: '__ref__:users/user_a',
                  },
                },
              },

              friends: {
                __doc__: {
                  user_a: {
                    referenceTo: '__ref__:users/user_a',
                  },
                },
              },
            },
          },
        },
      },
    },
  };
}
