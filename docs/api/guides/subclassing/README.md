# Dreem Language Guide

[//]: # This guide introduces some common features of Dreem and documents some unexpected features and aspects of the language

### Subclassing in Dream

New dream objects (a.k.a new html `<tags/>`) can be created using the `<class></class>` tag.

For example, if we wanted to create a “user” object that lays out a user's profile information, it might look something like this:

    @example small
    <class type="coffee" name="user">
        <attribute name="firstname" type="string" value=""></attribute>
        <attribute name="lastname" type="string" value=""></attribute>

        <text name="firstnamelabel" text="${this.parent.firstname}" color="darkblue"></text>
        <text name="lastnamelabel" text="${this.parent.lastname}" color="darkblue"></text>
    </class>

    <user width="100" height="40" bgcolor="lightyellow" firstname="Bobert" lastname="Chu"></user>

It works, but you'll notice the names are on top of one another.  Let's fix that and create a subclass.  Lets say we have another type of user,
and employee, which has an extra “job title” field:

    @example small
    <class type="coffee" name="user">
        <attribute name="firstname" type="string" value="Donathan"></attribute>
        <attribute name="lastname" type="string" value="Chillburger"></attribute>

        <text name="firstnamelabel" text="${this.parent.firstname}"></text>
        <text name="lastnamelabel" text="${this.parent.lastname}"></text>

        <handler event="oninit">
          tx = 0
          for subview in @subviews
            subview.setAttribute('x', tx)
            tx = subview.x + subview.width + 5
        </handler>
    </class>

    <class name="employee" extends="user" type="coffee">
      <attribute name="jobtitle" type="string" value=""></attribute>
      <text name="joblabel" text="${this.parent.jobtitle}" color="red"></text>
    </class>

    <employee jobtitle="COO"></employee>

You’ll note in dreem, the subclass's views appear first in the ordering.
In this case that isn't what we want, so we'll override the `layoutelements` method to put the job title last.

    @example small
    <class type="coffee" name="user">
        <attribute name="firstname" type="string" value="Donathan"></attribute>
        <attribute name="lastname" type="string" value="Chillburger"></attribute>

        <text name="firstnamelabel" text="${this.parent.firstname}"></text>
        <text name="lastnamelabel" text="${this.parent.lastname}"></text>

        <handler event="oninit" method="layoutelements"></handler>
        <method type="coffee" name="layoutelements">
          tx = 0
          for subview in @subviews
            subview.setAttribute('x', tx)
            tx = subview.x + subview.width + 5
        </method>
    </class>

    <class type="coffee" name="employee" extends="user">
        <text name="joblabel" text="COO" color="pink"></text>
        <method type="coffee" name="layoutelements">
            @super();
            @joblabel.setAttribute('x', @lastnamelabel.x + @lastnamelabel.width + 10);
        </method>
    </class>

    <employee></employee>

Note the subclasses uses the `@super()` method to invoke the parent class's implementation of the method.

