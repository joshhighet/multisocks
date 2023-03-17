#!/usr/bin/env python3
# check if a tor circuit is built and ready to use
import stem.control

def is_circuit_built():
    with stem.control.Controller.from_port(port=9051) as controller:
        controller.authenticate()
        circs = controller.get_circuits()
        for circ in circs:
            if circ.status == 'BUILT':
                return True
        return False

if __name__ == '__main__':
    if is_circuit_built():
        print('circuit is built')
    else:
        print('circuit is not built')
