let random = (l) => {
    return Math.floor(Math.random() * l)
}

const a1 = ["The", "A", "One", "Some", "Any"],
    a2 = ["boy", "girl", "dog", "town", "car"],
    a3 = ["drove", "jumped", "ran", "walked", "skipped"],
    a5 = ["the", "a", "one", "some", "any"],
    a6 = ["to", "from", "over", "under", "on"]

let i, i1, i2, i3, i4, i5, i6
  
for (i = 1; i <=20; i++) {

    i1 = random( a1.length )

    i2 = random( a2.length )
    i3 = random( a2.length )
    while (i2 == i3) { i3 = random( a2.length ) }

    i4 = random( a3.length )
    i5 = random( a5.length )
    while (i5 == i1) { i5 = random( a5.length ) }

    i6 = random( a6.length )

    let title = `${a1[i1]} ${a2[i2]} ${a3[i4]} ${a6[i6]} ${a5[i5]} ${a2[i3]}.`

    console.log(`title: ${title}`)
}