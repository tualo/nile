
@buildingcolor: #ccd;

#building{

  line-color: ligthen(@buildingcolor,-1);
  line-width: 1.5;
  opacity: 1;
  background-color: @buildingcolor;

  [building=*]{
    line-color: lighten( @buildingcolor, -1);
    background-color: @buildingcolor;
  }

}
