import Character from '../Character';

test('when "new Character()" called, an error is thrown', () => {
  const error = () => new Character();
  expect(error).toThrow();
});

test('when the inheritor of class Character called, an error isn\'t thrown', () => {
  class Inheritor extends Character {}
  const instance = () => new Inheritor();
  expect(instance).not.toThrow();
});
