/* Define a few colors */
@black: #000;
@orange: #a71;
@white: #fff;
@lightgray: #ddd;
@roadwidth: 3.5;
@outlineroadwidth: 4.3;

/* Draw roads as orange lines */
#roads::outline
{
  line-color: lighten(@orange,-40);
  line-width: 3.5;
  [highway=motorway],[highway=motorway_link] {        line-width: mult(add(@outlineroadwidth,1.6),4); }
  [highway=trunk],[highway=trunk_link] {              line-width: mult(add(@outlineroadwidth,1.6),4); }
  [highway=primary],[highway=primary_link] {          line-width: mult(add(@outlineroadwidth,1.3),4); }
  [highway=secondary],[highway=secondary_link] {      line-width: mult(add(@outlineroadwidth,1),4); }
  [highway=tertiary],[highway=tertiary_link] {        line-width: mult(add(@outlineroadwidth,1),3); }
  [highway=residential],[highway=residential_link] {  line-width: mult(add(@outlineroadwidth,0.5),2); }
  [highway=living_street]{                            line-width: mult(add(@outlineroadwidth,0),1); }
  [highway=service],[highway=service_link]{           line-width: mult(add(@outlineroadwidth,-0.5),1); }
  [highway=track],[highway=track_link]{               line-width: @outlineroadwidth; }
  [highway=footway],[highway=footway_link]{           line-width: @outlineroadwidth; }

}

#roads
{
    /* Usually, 3px wide */
    line-width: 3;
    line-color: @orange;


    [highway=motorway],[highway=motorway_link] {        line-color: lighten(@orange,0); }
    [highway=trunk],[highway=trunk_link] {              line-color: lighten(@orange,10); }
    [highway=primary],[highway=primary_link] {          line-color: lighten(@orange,40); }
    [highway=secondary],[highway=secondary_link] {      line-color: lighten(@orange,60); }
    [highway=tertiary],[highway=tertiary_link] {        line-color: lighten(@orange,80);}
    [highway=residential],[highway=residential_link] {  line-color: lighten(@orange,100);}
    [highway=living_street]{                            line-color: lighten(@orange,140); }
    [highway=service],[highway=service_link]{           line-color: lighten(@orange,150); }
    [highway=track],[highway=track_link]{               line-color: lighten(@orange,160); }
    [highway=footway],[highway=footway_link]{           line-color: lighten(@orange,170); }



    [highway=motorway],[highway=motorway_link] {        line-width: mult(add(@roadwidth,1.6),4); }
    [highway=trunk],[highway=trunk_link] {              line-width: mult(add(@roadwidth,1.6),4); }
    [highway=primary],[highway=primary_link] {          line-width: mult(add(@roadwidth,1.3),4); }
    [highway=secondary],[highway=secondary_link] {      line-width: mult(add(@roadwidth,1),4); }
    [highway=tertiary],[highway=tertiary_link] {        line-width: mult(add(@roadwidth,1),3); }
    [highway=residential],[highway=residential_link] {  line-width: mult(add(@roadwidth,0.5),2); }
    [highway=living_street]{                            line-width: mult(add(@roadwidth,0),1); }
    [highway=service],[highway=service_link]{           line-width: mult(add(@roadwidth,-0.5),1); }
    [highway=track],[highway=track_link]{               line-width: @roadwidth; }
    [highway=footway],[highway=footway_link]{           line-width: @roadwidth; }

    [bridge=yes]{

    }
    [tunnel=yes]{
      line-width: 15;

    }

}

#roads
{
  [zoom>12]{
    additional-property: 1;
  }
}
