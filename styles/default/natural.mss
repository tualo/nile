/* Start with a white background */
Map {
  background-color: #fff;
}

@woodcolor: #cfc;
@watercolor: #ccf;

#natural{
  line-color: #000;
  line-width: 1.5;
  background-color: transparent;

  [natural=wood]{
    line-color: lighten( @woodcolor, -20);
    background-color: @woodcolor;
  }
  [natural=forest]{
    line-color: lighten( @woodcolor, -20);
    background-color: @woodcolor;
  }

  [natural=water]{
    line-color: lighten( @watercolor, -20);
    background-color: @watercolor;
  }
}
