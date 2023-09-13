I recently saw a react mock interview on [youtube](https://www.youtube.com/watch?v=5xf4_Kx7azg) where they implemented a
simple wordle clone, however they used a lot of useEffects with a lot of
deps in the dependency array. I had just recently read through the
[react docs about useEffect](https://react.dev/learn/you-might-not-need-an-effect) and how you probably don't need it to handle user
input (it's intended to handle syncronization with external resources, etc, in
my understanding). So I wanted to to implement the same thing without useEffect.

Here it is, using only refs and state!

TODO
- Should it use onChange instead of of onKeyUp and just use onKeyUp for enter,
and backspace?
- Wordle actual logic does some handling of duplicate letters, etc, that I have
not thought about
- Real wordle also only lets you guess real words, which is a big part of the
game I guess, so probably should add that lol (eg rn you can get away with just
aeiou )