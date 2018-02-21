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
        },
      },

      users: {
        __doc__: {
          user_a: {
            age: 15,
            username: 'user_a',
          },

          user_b: {
            age: 10,
            username: 'user_b',
          },

          user_c: {
            age: 20,
            username: 'user_c',
          },
        },
      },
    },
  };
}
