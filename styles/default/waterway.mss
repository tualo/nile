
@wwcolor: #ddf;

#waterway{
  line-color: ligthen(@wwcolor,-10);
  line-width: 1.5;
  background-color: transparent;

  
  [waterway=drain],
  [waterway=lock],
  [waterway=pond],
  [waterway=weir],
  [waterway=reservoir],
  [waterway=ditch],
  [waterway=dam],
  [waterway=river],
  [waterway=bog],
  [waterway=riverbank],
  [waterway=stream],
  [waterway=lake]{
    line-color: lighten( @wwcolor, -20);
    background-color: @wwcolor;
  }

}
