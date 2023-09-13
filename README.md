I recently saw a react mock interview on [youtube](https://www.youtube.com/watch?v=5xf4_Kx7azg) where they implemented a
simple wordle clone, however they used a lot of useEffects with a lot of
deps in the dependency array. I had just recently read through the
[react docs about useEffect](https://react.dev/learn/you-might-not-need-an-effect) and how you probably don't need it to handle user
input (it's intended to handle synchronization with external resources, etc, in
my understanding). So I wanted to to implement the same thing without useEffect.

Here it is, using only refs and state (and one useEffect to fectch data from an
external api - which should be swapped for package like react-query at
some point).

TODO
- Should use form onSubmit instead of handling enter keypress? It should do the
same logic that's in the handle enter part
- Wordle actual logic does some handling of duplicate letters, etc, that I have
not thought about
- Real wordle also only lets you guess real words, which is a big part of the
game I guess, so probably should add that lol (eg rn you can get away with just
aeiou )