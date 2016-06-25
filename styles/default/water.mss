
@rcolor: #00f;

#water{
  line-color: @rcolor;
  line-width: 1.5;
  background-color: transparent;



  [water=water],[water=river],[water=lake],[water=reservoir],
  [water=fish_pond],[water=pond]{
    line-color: lighten( @rcolor, -20);
    background-color: @rcolor;
  }
}
