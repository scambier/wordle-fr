import { describe, expect, test } from 'vitest'

import { numberOfHalfDays } from '../utils'

describe('Utils', () => {
  test('numberOfHalfDays', () => {
    expect(
      numberOfHalfDays(new Date(2022, 0, 1, 10, 0), new Date(2022, 0, 1, 11, 0)),
    ).toEqual(0)
    expect(
      numberOfHalfDays(new Date(2022, 0, 1, 10, 0), new Date(2022, 0, 1, 13, 0)),
    ).toEqual(1)
    expect(
      numberOfHalfDays(new Date(2022, 0, 1, 10, 0), new Date(2022, 0, 3, 10, 0)),
    ).toEqual(4)
    expect(
      numberOfHalfDays(new Date(2022, 0, 1, 10, 0), new Date(2022, 0, 3, 13, 0)),
    ).toEqual(5)

    // Summer time shift
    expect(
      numberOfHalfDays(
        new Date(2022, 2, 27, 10, 0),
        new Date(2022, 2, 29, 7, 0),
      ),
    ).toEqual(4)

    expect(
      numberOfHalfDays(
        new Date(2022, 2, 29, 10, 0),
        new Date(2022, 2, 29, 7, 0),
      ),
    ).toEqual(0)
    expect(
      numberOfHalfDays(
        new Date(2022, 2, 28, 10, 0),
        new Date(2022, 2, 29, 7, 0),
      ),
    ).toEqual(2)
    expect(
      numberOfHalfDays(
        new Date(2022, 0, 12, 10, 0),
        new Date(2022, 2, 29, 7, 0),
      ),
    ).toEqual(152)
    expect(
      numberOfHalfDays(
        new Date(2022, 0, 12, 10, 0),
        new Date(2022, 2, 29, 21, 0),
      ),
    ).toEqual(153)
  })
})
