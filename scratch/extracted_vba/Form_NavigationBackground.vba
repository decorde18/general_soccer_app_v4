Attribute VB_Name = "Form_NavigationBackground"
Attribute VB_Base = "0{FE02F84F-0874-4D3A-9C35-7BD2395D829F}"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = True
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Attribute VB_TemplateDerived = False
Attribute VB_Customizable = False

Option Explicit




Private Sub Form_Open(Cancel As Integer)
'DoCmd.ShowToolbar "Ribbon", acToolbarNo
DoCmd.Maximize
Call TeamColors
Me.Section(acDetail).BackColor = RGB1

If DLookup("FirstEntry", "DatabaseDefaults", "[id]=1") = -1 Then
    DoCmd.OpenForm "DatabaseDefaultsForm"
Else: DoCmd.OpenForm "NavigationForm"
End If
Exit Sub
End Sub






